import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TransactionWithCategory } from '@/types/transaction';

/** Prefix of the single-transaction queries; mutations patch and invalidate by it. */
export const TRANSACTION_QUERY_KEY = 'transaction';

/**
 * One transaction by id, with the same category join as the list. Scoped to the workspace so
 * a link to another workspace's transaction resolves to null rather than showing it.
 */
export function useTransaction(
  workspaceId: string | null | undefined,
  id: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: [TRANSACTION_QUERY_KEY, workspaceId, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories!category_id(id, name, type, color, icon)')
        .eq('workspace_id', workspaceId!)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as TransactionWithCategory | null;
    },
    enabled: enabled && !!workspaceId && !!id,
  });
}
