import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

export type TransactionWithCategory = Tables<'transactions'> & {
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'type' | 'color' | 'icon'>;
  /** Supabase aggregate count from `receipt_proofs(count)` join — always a single-element tuple */
  receipt_proofs: [{ count: number }];
};

export function useTransactions(
  workspaceId: string | null | undefined,
  year: number,
  month: number,
  type?: 'income' | 'expense',
) {
  return useQuery({
    queryKey: ['transactions', workspaceId, year, month, type ?? 'all'],
    queryFn: async () => {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      let query = supabase
        .from('transactions')
        .select(
          '*, category:categories!category_id(id, name, type, color, icon), receipt_proofs(count)',
        )
        .eq('workspace_id', workspaceId!)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TransactionWithCategory[];
    },
    enabled: !!workspaceId,
  });
}

export function useTransactionsByYear(
  workspaceId: string | null | undefined,
  year: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['transactions-year', workspaceId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(
          '*, category:categories!category_id(id, name, type, color, icon), receipt_proofs(count)',
        )
        .eq('workspace_id', workspaceId!)
        .gte('date', `${year}-01-01`)
        .lt('date', `${year + 1}-01-01`)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as TransactionWithCategory[];
    },
    enabled: !!workspaceId && enabled,
  });
}
