import { BottomSheetView } from '@gorhom/bottom-sheet';

import { BottomSheet } from '@/components/bottom-sheet';
import { CalendarGrid } from '@/components/calendar-grid';

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onDismiss: () => void;
}

export function DatePicker({ visible, value, onSelect, onDismiss }: DatePickerProps) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <BottomSheetView>
        <CalendarGrid visible={visible} value={value} onSelect={onSelect} />
      </BottomSheetView>
    </BottomSheet>
  );
}
