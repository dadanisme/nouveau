import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requireDataSource, useDataSource } from '@/hooks/use-data-source';
import type { TablesInsert } from '@/types/supabase';

export function useAddTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async (transaction: TablesInsert<'transactions'>) => {
      await requireDataSource(source).addTransaction(transaction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-year'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-totals'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    },
  });
}
