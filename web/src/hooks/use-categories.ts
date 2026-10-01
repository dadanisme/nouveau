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
