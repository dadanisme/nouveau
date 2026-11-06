/**
 * The pure core of home-currency formatting: no i18n or Expo imports, so it can be checked with
 * plain bun (`scripts/check-currency-format.ts`). `utils/currency.ts` wraps it with the in-app
 * locale and the localized compact suffixes; app code imports from there.
 */

/** Currencies without minor units (no decimal input) */
const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'KRW', 'VND']);

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

/**
 * Symbols pinned regardless of the JS engine's locale data, so IDR always reads "Rp" (some locale
 * data gives "IDR" for it).
 */
const PINNED_SYMBOLS: Record<string, string> = { IDR: 'Rp' };

/**
 * Locales a currency is always grouped in, whatever the app language: IDR the Indonesian way
 * ("Rp1.500.000"). Other currencies follow the app language.
 */
const PINNED_GROUPING_LOCALES: Record<string, string> = { IDR: 'id-ID' };

/** A currency's narrow symbol in a BCP 47 locale ("Rp", "$", "€", "¥"), or its code. */
export function currencySymbolIn(currency: string, tag: string): string {
  const pinned = PINNED_SYMBOLS[currency];
  if (pinned) return pinned;
  try {
    const parts = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

/** The locale a home-currency amount is grouped in: the currency's own, else the app's `tag`. */
export function homeGroupingLocale(currency: string, tag: string): string {
  return PINNED_GROUPING_LOCALES[currency] ?? tag;
}

/**
 * A full home-currency amount: the symbol, then the amount grouped with the currency's decimals,
 * e.g. "Rp1.500.000", "$1,500.00", "¥1,500". `tag` is the app's BCP 47 locale.
 */
export function formatHomeAmountIn(value: number, currency: string, tag: string): string {
  const decimals = currencyDecimals(currency);
  const amount = value.toLocaleString(homeGroupingLocale(currency, tag), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currencySymbolIn(currency, tag)}${amount}`;
}

/** The localized compact suffixes ("B"/"M"/"K" in English, "M"/"Jt"/"Rb" in Indonesian). */
export interface CompactSuffixes {
  billion: string;
  million: string;
  thousand: string;
}

/** `value / unit` to at most one decimal, written the JS way ("1.2"). */
function compactNumber(value: number, unit: number): string {
  const compact = value / unit;
  return compact % 1 === 0 ? `${compact}` : `${parseFloat(compact.toFixed(1))}`;
}

/**
 * A compact home-currency amount: "Rp1.2M", "Rp1.2Jt", "$950.25", "$50", "$1.5K". Below a
 * thousand a currency with minor units shows them unless the amount is whole (with the decimal
 * mark of {@link formatHomeAmountIn}); one without them is rounded.
 */
export function formatCompactHomeAmountIn(
  value: number,
  currency: string,
  tag: string,
  suffixes: CompactSuffixes,
): string {
  const symbol = currencySymbolIn(currency, tag);
  if (value >= 1_000_000_000)
    return `${symbol}${compactNumber(value, 1_000_000_000)}${suffixes.billion}`;
  if (value >= 1_000_000) return `${symbol}${compactNumber(value, 1_000_000)}${suffixes.million}`;
  if (value >= 1_000) return `${symbol}${compactNumber(value, 1_000)}${suffixes.thousand}`;

  const decimals = currencyDecimals(currency);
  if (decimals === 0) return `${symbol}${Math.round(value)}`;
  // A whole amount drops its ".00", so axis ticks read "$50" rather than "$50.00".
  const minor = 10 ** decimals;
  const isWhole = Math.round(value * minor) % minor === 0;
  const amount = value.toLocaleString(homeGroupingLocale(currency, tag), {
    minimumFractionDigits: isWhole ? 0 : decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  });
  return `${symbol}${amount}`;
}
