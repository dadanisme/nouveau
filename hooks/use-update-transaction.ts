import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requireDataSource, useDataSource } from '@/hooks/use-data-source';
import type { TablesUpdate } from '@/types/supabase';

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'transactions'> & { id: string }) => {
      await requireDataSource(source).updateTransaction(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-year'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-totals'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    },
  });
}
