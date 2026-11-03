import { useLocalSearchParams } from 'expo-router';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useSheetResponder } from '@/hooks/use-sheet-result';
import type { Tables } from '@/types/supabase';

export interface CategoryPickerSheetParams {
  /** Only show categories of this type (`income` / `expense`); all when omitted. */
  type?: string;
  /** The currently selected category, highlighted in the grid. */
  selectedId?: string;
  requestId: string;
}

/** Screen hook for the `category-picker` sheet route. */
export function useCategoryPickerSheet() {
  const { type, selectedId } = useLocalSearchParams<Omit<CategoryPickerSheetParams, 'requestId'>>();
  const { currentWorkspaceId } = useWorkspace();
  const { data: categories = [] } = useCategories(currentWorkspaceId);
  const respond = useSheetResponder('category-picker');

  function selectCategory(category: Tables<'categories'>) {
    respond({ category });
  }

  return {
    categories: type ? categories.filter((c) => c.type === type) : categories,
    selectedCategoryId: selectedId || null,
    selectCategory,
  };
}
