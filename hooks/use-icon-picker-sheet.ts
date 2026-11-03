import { useLocalSearchParams } from 'expo-router';

import { useSheetResponder } from '@/hooks/use-sheet-result';
import { getCategoryColor } from '@/utils/category-color';
import { CATEGORY_ICON_GROUPS, type CategoryIconName } from '@/utils/category-icon';

export interface IconPickerSheetParams {
  /** The selected Ionicon name (without the `Ionicons/` prefix), if any. */
  selected?: string;
  /** The category's stored hex color; tints the selected icon. */
  color?: string;
  requestId: string;
}

/**
 * Screen hook for the `icon-picker` sheet route: offers the mapped icons by group and returns the
 * picked Ionicon name (the DB keeps Ionicon names; see `utils/category-icon.ts`).
 */
export function useIconPickerSheet() {
  const { selected, color } = useLocalSearchParams<Omit<IconPickerSheetParams, 'requestId'>>();
  const respond = useSheetResponder('icon-picker');

  return {
    groups: CATEGORY_ICON_GROUPS,
    selectedIcon: selected || null,
    selectedColor: getCategoryColor(color),
    selectIcon: (icon: CategoryIconName) => respond({ icon }),
  };
}
