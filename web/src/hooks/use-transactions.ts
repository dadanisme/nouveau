import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { DateRange, TransactionWithCategory } from '@/types/transaction';

/** Prefix shared by every transactions list query; mutations invalidate and patch by it. */
export const TRANSACTIONS_QUERY_KEY = 'transactions';

/** PostgREST caps a response at 1000 rows, and a wide date range can exceed that. */
const PAGE_SIZE = 1000;

export function transactionsQueryKey(workspaceId: string | null | undefined, range: DateRange) {
  return [TRANSACTIONS_QUERY_KEY, workspaceId, range.from, range.to] as const;
}

/**
 * Transactions of one workspace within an inclusive date range, newest first.
 * Scoped by `workspace_id` with the same category join as mobile's `useTransactions`.
 */
export function useTransactions(workspaceId: string | null | undefined, range: DateRange) {
  return useQuery({
    queryKey: transactionsQueryKey(workspaceId, range),
    queryFn: async () => {
      const rows: TransactionWithCategory[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, category:categories!category_id(id, name, type, color, icon)')
          .eq('workspace_id', workspaceId!)
          .gte('date', range.from)
          .lte('date', range.to)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...(data as TransactionWithCategory[]));
        if (data.length < PAGE_SIZE) return rows;
      }
    },
    enabled: !!workspaceId,
  });
}
