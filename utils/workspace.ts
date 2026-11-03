import { COMMON_CURRENCIES } from '@/constants/currencies';

/**
 * Home currency choices for the workspace forms: the common currencies, plus `current` first when
 * it isn't one of them (a workspace created elsewhere), so the picker can always show it.
 */
export function getHomeCurrencyOptions(current?: string): { value: string; label: string }[] {
  const codes: string[] = [...COMMON_CURRENCIES];
  if (current && !codes.includes(current)) codes.unshift(current);
  return codes.map((code) => ({ value: code, label: code }));
}
