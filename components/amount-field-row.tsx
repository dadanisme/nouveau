import { HStack, Text, TextField, useNativeState } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  keyboardType,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';

import { formatAmountInput, parseAmountInput, type AmountSeparators } from '@/utils/currency';

const AMOUNT_FONT = font({ textStyle: 'largeTitle', weight: 'bold' });

export interface AmountFieldRowProps {
  /** Accessibility label of the field (the visible prefix and placeholder don't name it). */
  label: string;
  /** Currency prefix shown before the amount, e.g. "Rp" or "$". */
  prefix: string;
  /** Initial canonical amount (`"1234.5"`), read once on mount; remount the row to reset it. */
  defaultAmount?: string;
  /** Minor units the currency allows; 0 ignores the decimal key. */
  decimals: number;
  /** How the amount is grouped as it's typed (`getAmountSeparators`), like the app shows it. */
  separators: AmountSeparators;
  autoFocus?: boolean;
  /** Called with the canonical amount string (`""` when empty). */
  onChangeAmount: (amount: string) => void;
}

/**
 * A large amount field row: the currency prefix and a SwiftUI `TextField` in the large-title
 * style with the system decimal keyboard. The text is regrouped on the UI thread as the user types
 * (the app's separators for the currency, e.g. "1.500.000"), and the parent gets the canonical
 * amount string.
 */
export function AmountFieldRow({
  label,
  prefix,
  defaultAmount = '',
  decimals,
  separators,
  autoFocus,
  onChangeAmount,
}: AmountFieldRowProps) {
  const text = useNativeState(formatAmountInput(defaultAmount, separators));

  const handleTextChange = (value: string) => {
    'worklet';
    const amount = parseAmountInput(value, decimals, separators);
    const formatted = formatAmountInput(amount, separators);
    if (formatted !== value) text.set(formatted);
    scheduleOnRN(onChangeAmount, amount);
  };

  return (
    <HStack spacing={8}>
      <Text modifiers={[AMOUNT_FONT, foregroundStyle(PlatformColor('secondaryLabel'))]}>
        {prefix}
      </Text>
      <TextField
        text={text}
        placeholder="0"
        autoFocus={autoFocus}
        onTextChange={handleTextChange}
        modifiers={[AMOUNT_FONT, keyboardType('decimal-pad'), accessibilityLabel(label)]}
      />
    </HStack>
  );
}
