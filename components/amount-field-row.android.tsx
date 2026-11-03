import { Text, TextField, useNativeState, type TextFieldRef } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useRef } from 'react';
import { scheduleOnRN } from 'react-native-worklets';

import type { AmountFieldRowProps } from '@/components/amount-field-row';
import { focusField, useAutoFocus, useResetEffect } from '@/hooks/use-auto-focus';
import { formatAmountInput, parseAmountInput } from '@/utils/currency';

// Compose text fields take a `TextStyle`, not a typography role, so this is the Material 3
// `headlineLarge` size (sp, so it still follows the system font scale).
const HEADLINE_LARGE_SIZE = 32;
// Material 3 list metrics, as in `native-form`.
const SIDE = 16;

/**
 * A large amount field row: a filled Material `TextField` with the currency as its prefix, the
 * amount in the `headlineLarge` size and the decimal keyboard. The text is regrouped on the UI
 * thread as the user types (the app's separators for the currency, e.g. "1.500.000"), and the
 * parent gets the canonical amount string.
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
  const selection = useNativeState({ start: 0, end: 0 });

  const handleValueChange = (value: string) => {
    'worklet';
    scheduleOnRN(onChangeAmount, parseAmountInput(value, decimals, separators));
    // Regroup on the next frame, from the text current by then (as on iOS), so no key typed in
    // between is lost; the caret goes back to the end.
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

  const handleFocusChange = useAutoFocus(ref, autoFocus);
  useResetEffect(resetKey, () => {
    const formatted = formatAmountInput(defaultAmount, separators);
    text.set(formatted);
    selection.set({ start: formatted.length, end: formatted.length });
    if (autoFocus) focusField(ref);
  });

  return (
    <TextField
      ref={ref}
      value={text}
      selection={selection}
      onValueChange={handleValueChange}
      onFocusChanged={handleFocusChange}
      singleLine
      keyboardOptions={{ keyboardType: 'decimal', imeAction: 'done' }}
      textStyle={{ fontSize: HEADLINE_LARGE_SIZE }}
      modifiers={[fillMaxWidth(), padding(SIDE, 8, SIDE, 8)]}
    >
      <TextField.Label>
        <Text>{label}</Text>
      </TextField.Label>
      <TextField.Placeholder>
        <Text style={{ typography: 'headlineLarge' }}>0</Text>
      </TextField.Placeholder>
      <TextField.Prefix>
        {/* Same size as the amount, so the prefix sits on its baseline. */}
        <Text style={{ typography: 'headlineLarge' }}>{`${prefix} `}</Text>
      </TextField.Prefix>
    </TextField>
  );
}
