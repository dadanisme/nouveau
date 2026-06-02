import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

export function processAmountKeyPress(prev: string, key: string): string {
  if (key === 'backspace') {
    return prev.slice(0, -1);
  }
  // IDR doesn't use decimals
  if (key === '.') return prev;
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

export function formatDisplayAmount(amountString: string): string {
  const prefix = i18n.t(k.currency.prefix);
  if (!amountString) return `${prefix}0`;
  const intPart = parseInt(amountString, 10).toLocaleString('id-ID');
  return `${prefix}${intPart}`;
}
