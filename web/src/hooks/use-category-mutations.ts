import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TRANSACTION_QUERY_KEY } from '@/hooks/use-transaction';
import { TRANSACTIONS_QUERY_KEY } from '@/hooks/use-transactions';
import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import type { Category } from '@/types/transaction';

const CATEGORIES_KEY = ['categories'] as const;

/** Transactions carry their category's name, colour and icon, so they are refetched too. */
function invalidateCategories(queryClient: QueryClient, includeTransactions: boolean) {
  void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  if (!includeTransactions) return;
  void queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
  void queryClient.invalidateQueries({ queryKey: [TRANSACTION_QUERY_KEY] });
}

export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: TablesInsert<'categories'>) => {
      const { error } = await supabase.from('categories').insert(category);
      if (error) throw error;
    },
    onSuccess: () => invalidateCategories(queryClient, false),
  });
}

export type UpdateCategoryInput = TablesUpdate<'categories'> & { id: string };

/** Shows the change at once in every cached category list and rolls back if it fails. */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCategoryInput) => {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: CATEGORIES_KEY });
      const snapshot = queryClient.getQueriesData<Category[]>({ queryKey: CATEGORIES_KEY });
      queryClient.setQueriesData<Category[]>({ queryKey: CATEGORIES_KEY }, (list) =>
        list?.map((category) => (category.id === id ? { ...category, ...updates } : category)),
      );
      return snapshot;
    },
    onError: (_error, _input, snapshot) => {
      for (const [key, list] of snapshot ?? []) queryClient.setQueryData(key, list);
    },
    onSettled: () => invalidateCategories(queryClient, true),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateCategories(queryClient, true),
  });
}

/** How many of the workspace's transactions use a category (asked before deleting it). */
export function useCategoryUsage(
  workspaceId: string | null | undefined,
  categoryId: string | undefined,
) {
  return useQuery({
    queryKey: ['category-usage', workspaceId, categoryId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId!)
        .eq('category_id', categoryId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!workspaceId && !!categoryId,
    // Always asked afresh: the answer decides what the delete dialog says.
    staleTime: 0,
    gcTime: 0,
  });
}
