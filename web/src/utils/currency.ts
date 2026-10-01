/** Mobile groups digits the Indonesian way everywhere (`toLocaleString('id-ID')`). */
const NUMBER_LOCALE = 'id-ID';
const SYMBOL_LOCALE = 'en-US';

/** Currencies without minor units (no decimal input) */
const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'KRW', 'VND']);

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

/** e.g. "Rp" for IDR, "$" for USD. Falls back to the code for unknown currencies. */
export function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat(SYMBOL_LOCALE, {
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
 * Full (non-compact) amount, e.g. "Rp1.250.000". Same shape as mobile's `formatCurrency`,
 * except the prefix and decimals follow the currency instead of being fixed to "Rp" / 0.
 */
export function formatAmount(value: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  const number = value.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${getCurrencySymbol(currency)}${number}`;
}

/** Amount with the sign mobile shows on transaction rows: "+" income, "-" expense. */
export function formatSignedAmount(value: number, type: string, currency: string): string {
  return `${type === 'income' ? '+' : '-'}${formatAmount(value, currency)}`;
}

/** A total that can be negative (net), with the minus in front of the symbol: "-Rp25.000". */
export function formatBalance(value: number, currency: string): string {
  return `${value < 0 ? '-' : ''}${formatAmount(Math.abs(value), currency)}`;
}

/** Formats an amount in its original (non-home) currency, e.g. "$11,806.97" */
export function formatForeignAmount(value: number, currency: string): string {
  try {
    return value.toLocaleString(SYMBOL_LOCALE, { style: 'currency', currency });
  } catch {
    return `${currency} ${value.toLocaleString(SYMBOL_LOCALE)}`;
  }
}

export interface AmountSeparators {
  group: string;
  decimal: string;
}

function separatorsOf(locale: string): AmountSeparators {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  };
}

const HOME_SEPARATORS = separatorsOf(NUMBER_LOCALE);
const FOREIGN_SEPARATORS = separatorsOf(SYMBOL_LOCALE);

/**
 * The separators an amount is displayed with, so an amount field can group digits the same
 * way while typing: `formatAmount`'s for amounts in the home currency ("2.000.000"),
 * `formatForeignAmount`'s for amounts in another currency ("11,806.97").
 */
export function amountSeparators(currency: string, homeCurrency: string): AmountSeparators {
  return currency === homeCurrency ? HOME_SEPARATORS : FOREIGN_SEPARATORS;
}

/** The plain string an amount input starts with when editing, e.g. 1250000 -> "1250000". */
export function toAmountInput(value: number, decimals: number): string {
  return String(Number(value.toFixed(decimals)));
}

/**
 * Parses a typed amount into a positive number, or null when it is not a valid amount.
 *
 * Accepts plain digits and grouped digits with either separator ("1.250.000", "1,250,000").
 * For currencies with decimals the last separator is the decimal mark when both kinds are
 * present ("1.250,50", "1,250.50"); a lone separator is a decimal mark unless it is a comma
 * followed by exactly three digits ("1,250" is 1250, "12,5" and "12.5" are 12.5).
 * Zero-decimal currencies (IDR) reject fractions rather than guess. A currency prefix and
 * spaces are ignored. Zero and negative amounts are invalid, as on mobile.
 */
export function parseAmountInput(input: string, decimals: number): number | null {
  const text = input.replace(/\s/g, '').replace(/^[^\d.,-]+/, '');
  if (!/^\d[\d.,]*$/.test(text) || /[.,]$/.test(text)) return null;

  const grouped = /^\d{1,3}([.,])\d{3}(\1\d{3})*$/;
  let normalized: string | null = null;

  if (/^\d+$/.test(text)) {
    normalized = text;
  } else if (decimals === 0) {
    normalized = grouped.test(text) ? text.replace(/[.,]/g, '') : null;
  } else {
    const lastDot = text.lastIndexOf('.');
    const lastComma = text.lastIndexOf(',');
    if (lastDot !== -1 && lastComma !== -1) {
      const decimalMark = lastDot > lastComma ? '.' : ',';
      const groupMark = decimalMark === '.' ? ',' : '.';
      const [whole, fraction, ...rest] = text.split(decimalMark);
      const wholeIsValid = whole.includes(groupMark)
        ? new RegExp(`^\\d{1,3}(\\${groupMark}\\d{3})+$`).test(whole)
        : false;
      if (rest.length === 0 && wholeIsValid && /^\d+$/.test(fraction)) {
        normalized = `${whole.split(groupMark).join('')}.${fraction}`;
      }
    } else {
      const mark = lastDot !== -1 ? '.' : ',';
      const pieces = text.split(mark);
      if (pieces.length > 2) {
        normalized = grouped.test(text) ? pieces.join('') : null;
      } else if (mark === ',' && grouped.test(text)) {
        normalized = pieces.join('');
      } else {
        normalized = `${pieces[0]}.${pieces[1]}`;
      }
    }
  }

  if (normalized === null) return null;
  const value = Number(Number(normalized).toFixed(decimals));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** An exchange rate for display, e.g. "1 USD = Rp16.250" or "1 IDR = $0.000062". */
export function formatRate(rate: number, from: string, to: string): string {
  const number = rate.toLocaleString(NUMBER_LOCALE, {
    maximumFractionDigits: rate >= 100 ? 0 : rate >= 1 ? 2 : undefined,
    maximumSignificantDigits: rate >= 1 ? undefined : 2,
  });
  return `1 ${from} = ${getCurrencySymbol(to)}${number}`;
}
