import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import type { FormSymbol } from '@/components/native-form-types';
import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useCategoryDeleteConfirmation } from '@/hooks/use-category-delete-confirmation';
import type { Tables } from '@/types/supabase';
import { getCategoryColor } from '@/utils/category-color';
import { getCategorySymbol } from '@/utils/category-icon';

type Category = Tables<'categories'>;

/** A category list row: the category plus its mapped native symbol in its color. */
export interface CategoryListItem {
  category: Category;
  symbol: FormSymbol;
}

function toListItem(category: Category): CategoryListItem {
  return {
    category,
    symbol: { ...getCategorySymbol(category.icon), color: getCategoryColor(category.color) },
  };
}

/**
 * Screen hook for Categories: the list split by type (with native symbols and colors), pull to
 * refresh, the form sheet, and delete behind a confirmation.
 */
export function useCategoryManagement() {
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspace();
  const { data: categories = [], isLoading, refetch } = useCategories(currentWorkspaceId);
  const { requestDelete } = useCategoryDeleteConfirmation();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense').map(toListItem),
    [categories],
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income').map(toListItem),
    [categories],
  );

  async function refresh() {
    await refetch();
  }

  function openAddForm() {
    router.push('/category-form');
  }

  function openEditForm(category: Category) {
    router.push({ pathname: '/category-form', params: { id: category.id } });
  }

  return {
    expenseCategories,
    incomeCategories,
    isEmpty: categories.length === 0,
    isLoading,
    refresh,
    openAddForm,
    openEditForm,
    requestDelete: (category: Category) => requestDelete(category),
  };
}
