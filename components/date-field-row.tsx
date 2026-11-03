import { DatePicker, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  datePickerStyle,
  fixedSize,
  foregroundStyle,
  labelsHidden,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

export interface DateFieldRowProps {
  title: string;
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * A date row: a SwiftUI `DatePicker` in the compact style (the title, and the date as a button
 * that opens the system calendar popover). At accessibility text sizes the title sits above the
 * date button, since the compact picker keeps both on one line and breaks the title apart.
 */
export function DateFieldRow({ title, value, onChange }: DateFieldRowProps) {
  const isStacked = useIsAccessibilityTextSize();

  if (isStacked) {
    return (
      <VStack alignment="leading" spacing={8}>
        <Text modifiers={[foregroundStyle(PlatformColor('label'))]}>{title}</Text>
        {/* Its ideal width, then a spacer, so the date button sits at the leading edge. */}
        <HStack>
          <DatePicker
            title={title}
            selection={value}
            displayedComponents={['date']}
            onDateChange={onChange}
            modifiers={[
              datePickerStyle('compact'),
              labelsHidden(),
              fixedSize(),
              accessibilityLabel(title),
            ]}
          />
          <Spacer />
        </HStack>
      </VStack>
    );
  }

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
