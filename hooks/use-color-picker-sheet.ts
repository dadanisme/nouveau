import { useLocalSearchParams } from 'expo-router';

import { useSheetResponder } from '@/hooks/use-sheet-result';

export interface ColorPickerSheetParams {
  /** The selected hex color. */
  selected?: string;
  requestId: string;
}

/** Screen hook for the `color-picker` sheet route. */
export function useColorPickerSheet() {
  const { selected } = useLocalSearchParams<Omit<ColorPickerSheetParams, 'requestId'>>();
  const respond = useSheetResponder('color-picker');

  return {
    selectedColor: selected ?? '',
    selectColor: (color: string) => respond({ color }),
  };
}
