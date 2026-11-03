import { ColorPickerList } from '@/components/color-picker-list';
import { useColorPickerSheet } from '@/hooks/use-color-picker-sheet';

/**
 * Category color picker sheet. Params: `selected` (hex), `requestId`; result: `color-picker` with
 * the picked system color's canonical palette hex (`utils/category-color.ts`). An inline SwiftUI
 * picker on iOS, a Compose radio list on Android.
 */
export default function ColorPickerSheet() {
  const { colors, selectedId, selectColor } = useColorPickerSheet();

  return <ColorPickerList colors={colors} selectedId={selectedId} onSelect={selectColor} />;
}
