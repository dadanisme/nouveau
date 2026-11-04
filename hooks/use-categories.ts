import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useCategories(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['categories', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

/**
 * How many transactions a category holds, i.e. how many deleting it would also delete (the FK
 * cascades). Fetched fresh at confirm time with `queryClient.fetchQuery`.
 */
export function categoryTransactionCountQuery(categoryId: string) {
  return {
    queryKey: ['category-transaction-count', categoryId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 0,
  };
}
