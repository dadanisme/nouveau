import { COMMON_CURRENCIES } from '@/constants/currencies';
import { getCurrencyName } from '@/utils/currency';

/**
 * Home currency choices for the workspace forms: the common currencies, plus `current` first when
 * it isn't one of them (a workspace created elsewhere), so the picker can always show it.
 */
export function getHomeCurrencyOptions(current?: string): { value: string; label: string }[] {
  const codes: string[] = [...COMMON_CURRENCIES];
  if (current && !codes.includes(current)) codes.unshift(current);
  return codes.map((code) => ({ value: code, label: code }));
}

/** A currency row: its name as the title and its code as the value ("US Dollar", "USD"). */
export type CurrencyStepRow = { code: string; title: string; value?: string };

/**
 * The onboarding currency step's rows (#78): the device's currency as the suggestion, then the
 * home currency choices without it, each named in the app language. A currency the locales don't
 * name shows its code as the title, with no value.
 */
export function getCurrencyStepRows(suggested: string): {
  suggested: CurrencyStepRow;
  others: CurrencyStepRow[];
} {
  const toRow = (code: string): CurrencyStepRow => {
    const name = getCurrencyName(code);
    return name ? { code, title: name, value: code } : { code, title: code };
  };
  return {
    suggested: toRow(suggested),
    others: getHomeCurrencyOptions()
      .filter((option) => option.value !== suggested)
      .map((option) => toRow(option.value)),
  };
}
