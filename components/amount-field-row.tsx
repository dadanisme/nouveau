import {
  HStack,
  Text,
  TextField,
  VStack,
  useNativeState,
  type TextFieldRef,
  type TextFieldSelection,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  keyboardType,
  lineLimit,
  minimumScaleFactor,
} from '@expo/ui/swift-ui/modifiers';
import { useRef } from 'react';
import { PlatformColor } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';

import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';
import { focusField, useAutoFocus, useResetEffect } from '@/hooks/use-auto-focus';
import { formatAmountInput, parseAmountInput, type AmountSeparators } from '@/utils/currency';

const AMOUNT_FONT = font({ textStyle: 'largeTitle', weight: 'bold' });
// One line that shrinks to fit rather than truncating: a long amount at a large text size stays
// readable in full.
const FIT_ONE_LINE = [lineLimit(1), minimumScaleFactor(0.5)];

export interface AmountFieldRowProps {
  /** Accessibility label of the field (the visible prefix and placeholder don't name it). */
  label: string;
  /** Currency prefix shown before the amount, e.g. "Rp" or "$". */
  prefix: string;
  /** Canonical amount (`"1234.5"`) the field shows on mount and whenever `resetKey` changes. */
  defaultAmount?: string;
  /** Change it to reload the field from `defaultAmount` (and refocus with `autoFocus`). */
  resetKey?: number;
  /** Minor units the currency allows; 0 ignores the decimal key. */
  decimals: number;
  /** How the amount is grouped as it's typed (`getAmountSeparators`), like the app shows it. */
  separators: AmountSeparators;
  /** Focus the field once its screen has presented, and again after each reset. */
  autoFocus?: boolean;
  /** Called with the canonical amount string (`""` when empty). */
  onChangeAmount: (amount: string) => void;
}

/**
 * A large amount field row: the currency prefix and a SwiftUI `TextField` in the large-title
 * style with the system decimal keyboard. The text is regrouped on the UI thread as the user types
 * (the app's separators for the currency, e.g. "1.500.000"), and the parent gets the canonical
 * amount string. At accessibility text sizes the prefix sits above the field, so the amount gets
 * the row's full width.
 */
export function AmountFieldRow({
  label,
  prefix,
  defaultAmount = '',
  resetKey = 0,
  decimals,
  separators,
  autoFocus,
  onChangeAmount,
}: AmountFieldRowProps) {
  const ref = useRef<TextFieldRef>(null);
  const text = useNativeState(formatAmountInput(defaultAmount, separators));
  const selection = useNativeState<TextFieldSelection>({ start: 0, end: 0 });

  const handleTextChange = (value: string) => {
    'worklet';
    scheduleOnRN(onChangeAmount, parseAmountInput(value, decimals, separators));
    // Regroup on the next frame, not inside the field's own text update (a write from there is
    // dropped and the caret lands mid-number). Reading the current text then keeps every key typed
    // since, and the caret goes back to the end.
    requestAnimationFrame(() => {
      const current = text.get();
      const formatted = formatAmountInput(
        parseAmountInput(current, decimals, separators),
        separators,
      );
      if (formatted === current) return;
      text.set(formatted);
      selection.set({ start: formatted.length, end: formatted.length });
    });
  };

  const isStacked = useIsAccessibilityTextSize();
  const handleFocusChange = useAutoFocus(ref, autoFocus);
  useResetEffect(resetKey, () => {
    const formatted = formatAmountInput(defaultAmount, separators);
    text.set(formatted);
    selection.set({ start: formatted.length, end: formatted.length });
    if (autoFocus) focusField(ref);
  });

  const prefixText = (
    <Text
      modifiers={[AMOUNT_FONT, foregroundStyle(PlatformColor('secondaryLabel')), ...FIT_ONE_LINE]}
    >
      {prefix}
    </Text>
  );
  const field = (
    <TextField
      ref={ref}
      text={text}
      selection={selection}
      placeholder="0"
      onTextChange={handleTextChange}
      onFocusChange={handleFocusChange}
      modifiers={[
        AMOUNT_FONT,
        ...FIT_ONE_LINE,
        keyboardType('decimal-pad'),
        accessibilityLabel(label),
      ]}
    />
  );

  return isStacked ? (
    <VStack alignment="leading" spacing={4}>
      {prefixText}
      {field}
    </VStack>
  ) : (
    <HStack spacing={8}>
      {prefixText}
      {field}
    </HStack>
  );
}
