import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { sessionQueryOptions } from '@/hooks/use-auth';
import {
  deleteTransactionsOnUnload,
  invalidateTransactions,
  useDeleteTransactions,
} from '@/hooks/use-transaction-mutations';
import { pendingDeletes } from '@/lib/pending-deletes';
import { en } from '@/locales/en';
import type { TransactionWithCategory } from '@/types/transaction';
import { interpolate } from '@/utils/string';

/** How long a delete can be undone before the DELETE is sent. */
const UNDO_DURATION_MS = 6000;

const t = en.transactions;

/** Ids of rows that are deleted in the UI but whose DELETE has not finished yet. */
export function usePendingDeleteIds(): ReadonlySet<string> {
  return useSyncExternalStore(pendingDeletes.subscribe, pendingDeletes.getHiddenIds);
}

/**
 * Delete with a real Undo: the rows disappear at once (see `usePendingDeleteIds`), and the
 * DELETE is only sent when the Undo toast runs out or is dismissed. Undo cancels it, so the
 * rows, and anything attached to them such as receipt proofs, are never touched.
 *
 * Whatever is still waiting is sent when the page that uses this hook unmounts (navigating
 * away, switching workspace) and when the tab is closed or reloaded.
 */
export function useDeferredDelete() {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteTransactions } = useDeleteTransactions();

  useEffect(() => {
    const onPageHide = () => {
      if (!pendingDeletes.hasWaiting) return;
      // Read synchronously from the cache: the auth listener keeps it current.
      const accessToken = queryClient.getQueryData(sessionQueryOptions.queryKey)?.access_token;
      if (!accessToken) return;
      void pendingDeletes
        .flush((ids) => deleteTransactionsOnUnload(ids, accessToken))
        // Only reached when the page survives (back/forward cache).
        .then(() => invalidateTransactions(queryClient));
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      void pendingDeletes.flush();
    };
  }, [queryClient]);

  return (rows: TransactionWithCategory[]) => {
    if (rows.length === 0) return;

    const commit = async (ids: string[]) => {
      try {
        await deleteTransactions(ids);
      } catch (error) {
        toast.error(t.deleteFailed, {
          description: error instanceof Error ? error.message : en.common.unexpectedError,
        });
        throw error;
      }
    };

    const toastId = crypto.randomUUID();
    const batchId = pendingDeletes.schedule(
      rows.map((row) => row.id),
      UNDO_DURATION_MS,
      commit,
      () => toast.dismiss(toastId),
    );

    // The queue owns the timer (the toast would pause its own while hovered or unfocused);
    // the toast stays up until the batch is committed or cancelled.
    toast(rows.length === 1 ? t.deletedOne : interpolate(t.deleted, { count: rows.length }), {
      id: toastId,
      duration: Infinity,
      action: { label: t.undo, onClick: () => pendingDeletes.cancel(batchId) },
      // Dismissed by hand: the delete goes ahead now. A no-op once the batch has left the queue.
      onDismiss: () => pendingDeletes.commit(batchId),
    });
  };
}
