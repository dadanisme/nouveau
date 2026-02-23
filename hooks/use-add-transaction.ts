import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/types/supabase';

export function useAddTransaction() {
  return useMutation({
    mutationFn: async (transaction: TablesInsert<'transactions'>) => {
      const { error } = await supabase.from('transactions').insert(transaction);
      if (error) throw error;
    },
  });
}
