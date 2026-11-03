import { DatePicker } from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';

export interface DateFieldRowProps {
  title: string;
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * A date row: a SwiftUI `DatePicker` in the compact style (the title, and the date as a button
 * that opens the system calendar popover).
 */
export function DateFieldRow({ title, value, onChange }: DateFieldRowProps) {
  return (
    <DatePicker
      title={title}
      selection={value}
      displayedComponents={['date']}
      onDateChange={onChange}
      modifiers={[datePickerStyle('compact')]}
    />
  );
}
