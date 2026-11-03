import { useLocalSearchParams } from 'expo-router';

import { useSheetResponder } from '@/hooks/use-sheet-result';

export interface IconPickerSheetParams {
  /** The selected Ionicon name (without the `Ionicons/` prefix), if any. */
  selected?: string;
  /** Hex fill for the selected cell (the category's color). */
  color?: string;
  requestId: string;
}

const FALLBACK_ACCENT = '#6B7280';

/** Screen hook for the `icon-picker` sheet route. */
export function useIconPickerSheet() {
  const { selected, color } = useLocalSearchParams<Omit<IconPickerSheetParams, 'requestId'>>();
  const respond = useSheetResponder('icon-picker');

  return {
    selectedIcon: selected || null,
    accentColor: color || FALLBACK_ACCENT,
    selectIcon: (icon: string) => respond({ icon }),
  };
}
