import { IconPickerGrid } from '@/components/icon-picker-grid';
import { useIconPickerSheet } from '@/hooks/use-icon-picker-sheet';

/**
 * Category icon picker sheet. Params: `selected` (Ionicon name), `color` (hex), `requestId`;
 * result: `icon-picker` with the picked Ionicon name. Offers only icons with a native mapping
 * (`utils/category-icon.ts`): a SwiftUI grid on iOS, a Compose grid on Android.
 */
export default function IconPickerSheet() {
  const { groups, selectedIcon, selectedColor, selectIcon } = useIconPickerSheet();

  return (
    <IconPickerGrid
      groups={groups}
      selectedIcon={selectedIcon}
      selectedColor={selectedColor}
      onSelect={selectIcon}
    />
  );
}
