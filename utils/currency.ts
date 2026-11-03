import i18n, { getDateLocale } from '@/lib/i18n';
import { k } from '@/locales/keys';

/** Currencies without minor units (no decimal input) */
const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'KRW', 'VND']);

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

export function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat(getDateLocale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

/**
 * "Rp1.2M" / "Rp1,2jt". `locale` pins the suffixes to that language; pass the in-app locale from
 * `useLanguage()` where the result is memoized, so it updates when the language changes.
 */
export function formatCompactAmount(value: number, locale?: string): string {
  const options = locale ? { locale } : undefined;
  const prefix = i18n.t(k.currency.prefix, options);
  const billion = i18n.t(k.currency.billion, options);
  const million = i18n.t(k.currency.million, options);
  const thousand = i18n.t(k.currency.thousand, options);

  if (value >= 1_000_000_000) {
    const compact = value / 1_000_000_000;
    return compact % 1 === 0
      ? `${prefix}${compact}${billion}`
      : `${prefix}${parseFloat(compact.toFixed(1))}${billion}`;
  }
  if (value >= 1_000_000) {
    const compact = value / 1_000_000;
    return compact % 1 === 0
      ? `${prefix}${compact}${million}`
      : `${prefix}${parseFloat(compact.toFixed(1))}${million}`;
  }
  if (value >= 1_000) {
    const compact = value / 1_000;
    return compact % 1 === 0
      ? `${prefix}${compact}${thousand}`
      : `${prefix}${parseFloat(compact.toFixed(1))}${thousand}`;
  }
  return `${prefix}${Math.round(value)}`;
}

export function formatSignedCompactAmount(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatCompactAmount(Math.abs(value))}`;
}

/** Home-currency amounts are grouped the Indonesian way in every app language ("Rp1.500.000"). */
const HOME_AMOUNT_LOCALE = 'id-ID';

export function formatCurrency(value: number): string {
  const prefix = i18n.t(k.currency.prefix);
  return `${prefix}${value.toLocaleString(HOME_AMOUNT_LOCALE, { maximumFractionDigits: 0 })}`;
}

/**
 * Prefix shown before an amount being entered: the home currency uses the locale prefix (e.g.
 * "Rp"), a foreign currency its own symbol.
 */
export function getAmountPrefix(currency?: string): string {
  return currency ? getCurrencySymbol(currency) : i18n.t(k.currency.prefix);
}

/** The separators the amount field types and shows. */
export interface AmountSeparators {
  decimal: string;
  group: string;
}

/**
 * The separators an amount being entered is shown with, matching how the app displays amounts:
 * the home currency like {@link formatCurrency} ("1.500.000"), a foreign currency like
 * {@link formatForeignAmount} in the in-app locale. Pass `locale` from `useLanguage()` so the
 * result follows a language change.
 */
export function getAmountSeparators(currency?: string, locale?: string): AmountSeparators {
  const tag = currency ? getDateLocale(locale) : HOME_AMOUNT_LOCALE;
  try {
    const parts = new Intl.NumberFormat(tag).formatToParts(1234567.5);
    const group = parts.find((part) => part.type === 'group')?.value;
    const decimal = parts.find((part) => part.type === 'decimal')?.value;
    if (group && decimal && group !== decimal) return { group, decimal };
  } catch {
    // Fall through to the home-currency separators.
  }
  return { group: '.', decimal: ',' };
}

/** Longest integer part the amount field accepts. */
const MAX_AMOUNT_INTEGER_DIGITS = 12;

/**
 * Reads amount-field text as a canonical amount string (`"1234"`, `"12.5"`, `""`): digits plus at
 * most one `.` with up to `decimals` fraction digits, and no leading zeros. Group separators are
 * dropped. A decimal mark only counts when the currency has minor units (`decimals > 0`): the
 * display decimal separator, any other `.`/`,`, or a group separator typed as the last character
 * (the keyboard's decimal key can type the display group separator; grouping never ends the
 * text with one).
 *
 * A worklet, so the amount field can reformat on the UI thread as the user types; it also runs as
 * a plain function on the JS thread.
 */
export function parseAmountInput(
  text: string,
  decimals: number,
  separators: AmountSeparators,
): string {
  'worklet';
  let integer = '';
  let fraction: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch >= '0' && ch <= '9') {
      if (fraction === null) {
        if (integer.length < MAX_AMOUNT_INTEGER_DIGITS) integer += ch;
      } else if (fraction.length < decimals) {
        fraction += ch;
      }
    } else if (decimals > 0 && fraction === null) {
      const isDecimalMark =
        ch === separators.decimal ||
        (ch === separators.group ? i === text.length - 1 : ch === '.' || ch === ',');
      if (isDecimalMark) fraction = '';
    }
  }
  while (integer.length > 1 && integer[0] === '0') integer = integer.slice(1);
  if (fraction === null) return integer;
  return `${integer || '0'}.${fraction}`;
}

/**
 * Shows a canonical amount string (see {@link parseAmountInput}) with the given separators, e.g.
 * `"1234567"` → `"1.234.567"` for the home currency. A worklet, like `parseAmountInput`.
 */
export function formatAmountInput(amount: string, separators: AmountSeparators): string {
  'worklet';
  if (!amount) return '';
  const dot = amount.indexOf('.');
  const integer = dot === -1 ? amount : amount.slice(0, dot);
  let grouped = '';
  for (let i = 0; i < integer.length; i++) {
    if (i > 0 && (integer.length - i) % 3 === 0) grouped += separators.group;
    grouped += integer[i];
  }
  return dot === -1 ? grouped : `${grouped}${separators.decimal}${amount.slice(dot + 1)}`;
}

/** Whether a canonical amount string is a positive amount. */
export function isPositiveAmount(amount: string): boolean {
  const value = parseFloat(amount);
  return Number.isFinite(value) && value > 0;
}

/** Formats an amount in its original (non-home) currency, e.g. "$11,806.97" */
export function formatForeignAmount(value: number, currency: string): string {
  try {
    return value.toLocaleString(getDateLocale(), { style: 'currency', currency });
  } catch {
    return `${currency} ${value.toLocaleString(getDateLocale())}`;
  }
}
