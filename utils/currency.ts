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

export function processAmountKeyPress(prev: string, key: string, decimals = 0): string {
  if (key === 'backspace') {
    return prev.slice(0, -1);
  }
  if (key === '.') {
    // Zero-decimal currencies (e.g. IDR) don't use decimals; only one separator allowed
    if (decimals === 0 || prev.includes('.')) return prev;
    return prev === '' ? '0.' : prev + '.';
  }
  // Cap fractional digits at the currency's minor units
  const decimalPart = prev.split('.')[1];
  if (decimalPart !== undefined && decimalPart.length >= decimals) return prev;
  // No leading zeros
  if (prev === '0') return key;
  // Limit length
  if (prev.length >= 12) return prev;
  return prev + key;
}

export function formatCompactAmount(value: number): string {
  const prefix = i18n.t(k.currency.prefix);
  const billion = i18n.t(k.currency.billion);
  const million = i18n.t(k.currency.million);
  const thousand = i18n.t(k.currency.thousand);

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

export function formatCurrency(value: number): string {
  const prefix = i18n.t(k.currency.prefix);
  return `${prefix}${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

export function formatDisplayAmount(amountString: string, currency?: string): string {
  // Default (home currency) input uses the locale prefix; foreign input uses its own symbol
  const prefix = currency ? getCurrencySymbol(currency) : i18n.t(k.currency.prefix);
  if (!amountString) return `${prefix}0`;
  const [intString, decimalPart] = amountString.split('.');
  const intPart = parseInt(intString || '0', 10).toLocaleString('id-ID');
  return decimalPart !== undefined ? `${prefix}${intPart}.${decimalPart}` : `${prefix}${intPart}`;
}

/** Formats an amount in its original (non-home) currency, e.g. "$11,806.97" */
export function formatForeignAmount(value: number, currency: string): string {
  try {
    return value.toLocaleString(getDateLocale(), { style: 'currency', currency });
  } catch {
    return `${currency} ${value.toLocaleString(getDateLocale())}`;
  }
}
