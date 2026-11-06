import type { CommonCurrency } from '@/constants/currencies';
import i18n, { getDateLocale } from '@/lib/i18n';
import { k } from '@/locales/keys';
import {
  currencyDecimals,
  currencySymbolIn,
  formatCompactHomeAmountIn,
  formatHomeAmountIn,
  homeGroupingLocale,
  separatorsIn,
} from '@/utils/currency-format';

export { currencyDecimals };

/**
 * A currency's narrow symbol ("Rp", "$", "€", "¥"), or its code. `locale` defaults to the in-app
 * language.
 */
export function getCurrencySymbol(currency: string, locale?: string): string {
  return currencySymbolIn(currency, getDateLocale(locale));
}

/**
 * A compact home-currency amount: "Rp1.2M" / "Rp1.2Jt", "$1.5K", "$950.25". `currency` is the
 * workspace's (or the row's) `home_currency`. `locale` pins the suffixes and grouping to that
 * language; pass the in-app locale from `useLanguage()` where the result is memoized, so it
 * updates when the language changes.
 */
export function formatCompactAmount(value: number, currency: string, locale?: string): string {
  const options = locale ? { locale } : undefined;
  return formatCompactHomeAmountIn(value, currency, getDateLocale(locale), {
    billion: i18n.t(k.currency.billion, options),
    million: i18n.t(k.currency.million, options),
    thousand: i18n.t(k.currency.thousand, options),
  });
}

export function formatSignedCompactAmount(
  value: number,
  currency: string,
  locale?: string,
): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatCompactAmount(Math.abs(value), currency, locale)}`;
}

/**
 * A full home-currency amount with the currency's decimals: "Rp1.500.000" (IDR is grouped the
 * Indonesian way in every app language), "$1,500.00", "¥1,500". `locale` as in
 * {@link formatCompactAmount}.
 */
export function formatCurrency(value: number, currency: string, locale?: string): string {
  return formatHomeAmountIn(value, currency, getDateLocale(locale));
}

/** Prefix shown before an amount being entered: the currency's symbol (e.g. "Rp", "$"). */
export function getAmountPrefix(currency: string, locale?: string): string {
  return getCurrencySymbol(currency, locale);
}

/** The separators the amount field types and shows. */
export interface AmountSeparators {
  decimal: string;
  group: string;
}

/**
 * The separators an amount being entered is shown with, matching how the app displays amounts:
 * the home currency like {@link formatCurrency} (IDR "1.500.000", USD in English "1,500.00"), a
 * foreign currency like {@link formatForeignAmount} in the in-app locale. Pass `locale` from
 * `useLanguage()` so the result follows a language change.
 */
export function getAmountSeparators(
  currency: string,
  isHome: boolean,
  locale?: string,
): AmountSeparators {
  const appTag = getDateLocale(locale);
  const tag = isHome ? homeGroupingLocale(currency, appTag) : appTag;
  return separatorsIn(tag);
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

const CURRENCY_NAME_KEYS: Record<CommonCurrency, string> = {
  IDR: k.currencyNames.IDR,
  USD: k.currencyNames.USD,
  EUR: k.currencyNames.EUR,
  GBP: k.currencyNames.GBP,
  JPY: k.currencyNames.JPY,
  SGD: k.currencyNames.SGD,
  AUD: k.currencyNames.AUD,
  MYR: k.currencyNames.MYR,
};

/**
 * A common currency's name in the app language ("Indonesian Rupiah"), from the locales rather
 * than `Intl.DisplayNames`, so both platforms say the same; undefined for any other code.
 */
export function getCurrencyName(code: string): string | undefined {
  const key = CURRENCY_NAME_KEYS[code as CommonCurrency];
  return key ? i18n.t(key) : undefined;
}
