import { Text, TextField, useNativeState } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { scheduleOnRN } from 'react-native-worklets';

import type { AmountFieldRowProps } from '@/components/amount-field-row';
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
  decimals,
  separators,
  autoFocus,
  onChangeAmount,
}: AmountFieldRowProps) {
  const text = useNativeState(formatAmountInput(defaultAmount, separators));

  const handleValueChange = (value: string) => {
    'worklet';
    const amount = parseAmountInput(value, decimals, separators);
    const formatted = formatAmountInput(amount, separators);
    if (formatted !== value) text.set(formatted);
    scheduleOnRN(onChangeAmount, amount);
  };

  return (
    <TextField
      value={text}
      onValueChange={handleValueChange}
      autoFocus={autoFocus}
      singleLine
      keyboardOptions={{ keyboardType: 'decimal', imeAction: 'done' }}
      textStyle={{ fontSize: HEADLINE_LARGE_SIZE }}
      modifiers={[fillMaxWidth(), padding(SIDE, 8, SIDE, 8)]}
    >
      <TextField.Label>
        <Text>{label}</Text>
      </TextField.Label>
      <TextField.Placeholder>
        <Text>0</Text>
      </TextField.Placeholder>
      <TextField.Prefix>
        <Text>{`${prefix} `}</Text>
      </TextField.Prefix>
    </TextField>
  );
}
