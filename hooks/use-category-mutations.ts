import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requireDataSource, useDataSource } from '@/hooks/use-data-source';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';

export function useAddCategory() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async (category: TablesInsert<'categories'>) => {
      await requireDataSource(source).addCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'categories'> & { id: string }) => {
      await requireDataSource(source).updateCategory(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await requireDataSource(source).deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
