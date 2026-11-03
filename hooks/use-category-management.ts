import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import type { Tables } from '@/types/supabase';

/** Screen hook for Categories: the list split by type, pull to refresh, and the form sheet. */
export function useCategoryManagement() {
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspace();
  const {
    data: categories = [],
    isLoading,
    refetch: queryRefetch,
  } = useCategories(currentWorkspaceId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryRefetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryRefetch]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories],
  );

  function openAddForm() {
    router.push('/category-form');
  }

  function openEditForm(category: Tables<'categories'>) {
    router.push({ pathname: '/category-form', params: { id: category.id } });
  }

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading,
    isRefreshing,
    refetch,
    openAddForm,
    openEditForm,
  };
}
