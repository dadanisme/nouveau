import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/supabase';

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TablesInsert<'transactions'>) => {
      const { error } = await supabase.from('transactions').insert(transaction);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-totals'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    },
  });
}
