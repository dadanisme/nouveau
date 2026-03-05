import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

export type TransactionWithCategory = Tables<'transactions'> & {
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'type' | 'color' | 'icon'>;
};

export function useTransactions(
  userId: string | undefined,
  year: number,
  month: number,
  type?: 'income' | 'expense',
) {
  return useQuery({
    queryKey: ['transactions', userId, year, month, type ?? 'all'],
    queryFn: async () => {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      let query = supabase
        .from('transactions')
        .select('*, category:categories!category_id(id, name, type, color, icon)')
        .eq('user_id', userId!)
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
    enabled: !!userId,
  });
}

export function useBalance(userId: string | undefined) {
  return useQuery({
    queryKey: ['balance', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_balance', { uid: userId! });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!userId,
  });
}

export function useMonthlyTotals(userId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-totals', userId, year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data, error } = await supabase.rpc('get_monthly_totals', {
        uid: userId!,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      const row = (data as { income: number; expense: number }[])[0];
      return row ?? { income: 0, expense: 0 };
    },
    enabled: !!userId,
  });
}

export function useRecentTransactions(userId: string | undefined, limit = 6) {
  return useQuery({
    queryKey: ['recent-transactions', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories!category_id(id, name, type, color, icon)')
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as TransactionWithCategory[];
    },
    enabled: !!userId,
  });
}
