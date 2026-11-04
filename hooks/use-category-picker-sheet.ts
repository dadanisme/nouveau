import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { toCategoryListItem, type CategoryListItem } from '@/hooks/use-category-management';
import { useSheetResponder } from '@/hooks/use-sheet-result';
import type { Tables } from '@/types/supabase';

export interface CategoryPickerSheetParams {
  /**
   * Only list categories of this type (`income` / `expense`), e.g. recategorizing a transaction
   * whose type stays the same.
   */
  type?: string;
  /**
   * List every type, this one (`income` / `expense`) first, for a presenter that adopts the
   * picked category's type (Add/Edit Transaction). Ignored with `type`.
   */
  currentType?: string;
  /** The currently selected category, checked in the list. */
  selectedId?: string;
  requestId: string;
}

type CategoryType = 'expense' | 'income';

/** One section of the picker: the categories of one type. */
export interface CategoryPickerGroup {
  type: CategoryType;
  items: CategoryListItem[];
}

/**
 * Screen hook for the `category-picker` sheet route: the workspace's categories (one type, or all
 * grouped by type), with native symbols and colors. Picking one returns it and closes the sheet.
 */
export function useCategoryPickerSheet() {
  const { type, currentType, selectedId } =
    useLocalSearchParams<Omit<CategoryPickerSheetParams, 'requestId'>>();
  const { currentWorkspaceId } = useWorkspace();
  const { data: categories = [], isLoading } = useCategories(currentWorkspaceId);
  const respond = useSheetResponder('category-picker');

  const groups = useMemo(() => {
    const order: CategoryType[] =
      type === 'income' || type === 'expense'
        ? [type]
        : currentType === 'income'
          ? ['income', 'expense']
          : ['expense', 'income'];
    return order
      .map((groupType) => ({
        type: groupType,
        items: categories.filter((c) => c.type === groupType).map(toCategoryListItem),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, type]);

  function selectCategory(category: Tables<'categories'>) {
    respond({ category });
  }

  return {
    groups,
    isLoading,
    isEmpty: !isLoading && groups.length === 0,
    selectedCategoryId: selectedId || null,
    selectCategory,
  };
}
