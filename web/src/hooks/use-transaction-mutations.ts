import {
  type QueryClient,
  type QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { TRANSACTION_QUERY_KEY } from '@/hooks/use-transaction';
import { TRANSACTIONS_QUERY_KEY } from '@/hooks/use-transactions';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/types/supabase';
import type { DateRange, TransactionCategory, TransactionWithCategory } from '@/types/transaction';
import {
  chunk,
  insertIntoTransactionList,
  patchTransactionList,
  removeFromTransactionList,
  toInsertPayload,
} from '@/utils/transaction';

const LIST_KEY = [TRANSACTIONS_QUERY_KEY] as const;
const SINGLE_KEY = [TRANSACTION_QUERY_KEY] as const;
const MUTATION_KEY = ['transactions-mutation'] as const;
/** Ids per request for `id=in.(...)` filters. */
const ID_BATCH_SIZE = 100;

type ListSnapshot = [QueryKey, TransactionWithCategory[] | undefined][];
type ListUpdater = (
  list: TransactionWithCategory[],
  scope: { workspaceId: string; range: DateRange },
) => TransactionWithCategory[];

/**
 * Applies an optimistic change to every cached transactions list and returns the previous
 * lists for rollback. List keys are `['transactions', workspaceId, from, to]`.
 */
async function updateLists(queryClient: QueryClient, update: ListUpdater): Promise<ListSnapshot> {
  await queryClient.cancelQueries({ queryKey: LIST_KEY });
  const snapshot = queryClient.getQueriesData<TransactionWithCategory[]>({ queryKey: LIST_KEY });
  for (const [key, list] of snapshot) {
    if (!list) continue;
    const [, workspaceId, from, to] = key as [string, string, string, string];
    queryClient.setQueryData(key, update(list, { workspaceId, range: { from, to } }));
  }
  return snapshot;
}

function restoreLists(queryClient: QueryClient, snapshot: ListSnapshot | undefined) {
  for (const [key, list] of snapshot ?? []) queryClient.setQueryData(key, list);
}

/** Refetch once the last in-flight transaction mutation settles, so edits do not flicker. */
function refetchWhenIdle(queryClient: QueryClient) {
  if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) > 1) return;
  // Same keys mobile invalidates that exist on web so far.
  void queryClient.invalidateQueries({ queryKey: LIST_KEY });
  void queryClient.invalidateQueries({ queryKey: ['transactions-year'] });
  void queryClient.invalidateQueries({ queryKey: SINGLE_KEY });
}

/**
 * Applies an edit to the single-transaction queries the side panel reads when its transaction
 * is outside the loaded period. No snapshot: the refetch after the mutation corrects them.
 */
function patchSingles(
  queryClient: QueryClient,
  ids: ReadonlySet<string>,
  patch: TablesUpdate<'transactions'>,
  category: TransactionCategory | undefined,
) {
  queryClient.setQueriesData<TransactionWithCategory | null>({ queryKey: SINGLE_KEY }, (tx) =>
    tx && ids.has(tx.id) ? { ...tx, ...patch, category: category ?? tx.category } : tx,
  );
}

/** Inserts one or many rows. Rows carry their own ids, so an undo restores the originals. */
export function useInsertTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: async (rows: TransactionWithCategory[]) => {
      // `defaultToNull: false`: when rows differ in which timestamps they carry, a missing
      // column takes the database default instead of NULL.
      const { error } = await supabase
        .from('transactions')
        .insert(rows.map(toInsertPayload), { defaultToNull: false });
      if (error) throw error;
    },
    onMutate: (rows) =>
      updateLists(queryClient, (list, { workspaceId, range }) =>
        insertIntoTransactionList(list, rows, workspaceId, range),
      ),
    onError: (_error, _rows, snapshot) => restoreLists(queryClient, snapshot),
    onSettled: () => refetchWhenIdle(queryClient),
  });
}

export interface UpdateTransactionsInput {
  ids: string[];
  patch: TablesUpdate<'transactions'>;
  /** The joined category to show optimistically when `patch.category_id` changes. */
  category?: TransactionCategory;
}

/** Applies the same patch to one or many rows (inline edits, bulk change category). */
export function useUpdateTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: async ({ ids, patch }: UpdateTransactionsInput) => {
      for (const batch of chunk(ids, ID_BATCH_SIZE)) {
        const { error } = await supabase.from('transactions').update(patch).in('id', batch);
        if (error) throw error;
      }
    },
    onMutate: ({ ids, patch, category }) => {
      const idSet = new Set(ids);
      patchSingles(queryClient, idSet, patch, category);
      return updateLists(queryClient, (list, { range }) =>
        patchTransactionList(list, idSet, patch, category, range),
      );
    },
    onError: (_error, _input, snapshot) => restoreLists(queryClient, snapshot),
    onSettled: () => refetchWhenIdle(queryClient),
  });
}

export function useDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: async (ids: string[]) => {
      for (const batch of chunk(ids, ID_BATCH_SIZE)) {
        const { error } = await supabase.from('transactions').delete().in('id', batch);
        if (error) throw error;
      }
    },
    onMutate: (ids) => {
      const idSet = new Set(ids);
      return updateLists(queryClient, (list) => removeFromTransactionList(list, idSet));
    },
    onError: (_error, _ids, snapshot) => restoreLists(queryClient, snapshot),
    onSettled: () => refetchWhenIdle(queryClient),
  });
}

/**
 * The same DELETE as `useDeleteTransactions`, for the moment the page is going away
 * (`pagehide`). It is a plain `keepalive` request to the REST endpoint because supabase-js
 * looks up the session asynchronously before it sends anything, which a closing page never
 * gets to finish. The only Supabase call outside a React Query hook; RLS applies as usual.
 */
export async function deleteTransactionsOnUnload(
  ids: string[],
  accessToken: string,
): Promise<void> {
  const requests = chunk(ids, ID_BATCH_SIZE).map((batch) =>
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions?id=in.(${batch.join(',')})`, {
      method: 'DELETE',
      keepalive: true,
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );
  const responses = await Promise.all(requests);
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Delete failed with status ${failed.status}`);
}

/** Refetches every transactions query (after a delete that bypassed the mutation hooks). */
export function invalidateTransactions(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: LIST_KEY });
  void queryClient.invalidateQueries({ queryKey: SINGLE_KEY });
}
