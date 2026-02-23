import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useCategories(userId: string | undefined) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
