import { useLocalSearchParams } from 'expo-router';

import { useSheetResponder } from '@/hooks/use-sheet-result';
import {
  CATEGORY_SYSTEM_COLORS,
  getCategorySystemColor,
  getSystemColorById,
  type CategorySystemColorId,
} from '@/utils/category-color';

export interface ColorPickerSheetParams {
  /** The selected hex color. */
  selected?: string;
  requestId: string;
}

/**
 * Screen hook for the `color-picker` sheet route: offers the system colors and returns the picked
 * one's canonical palette hex (the DB keeps hexes; see `utils/category-color.ts`). Any other stored
 * hex shows its nearest system color as selected; it's only rewritten if the user picks a color.
 */
export function useColorPickerSheet() {
  const { selected } = useLocalSearchParams<Omit<ColorPickerSheetParams, 'requestId'>>();
  const respond = useSheetResponder('color-picker');

  return {
    colors: CATEGORY_SYSTEM_COLORS,
    selectedId: getCategorySystemColor(selected)?.id ?? null,
    selectColor: (id: CategorySystemColorId) => respond({ color: getSystemColorById(id).hex }),
  };
}
