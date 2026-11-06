import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requireDataSource, useDataSource } from '@/hooks/use-data-source';

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async (id: string) => {
      await requireDataSource(source).deleteTransaction(id);
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
