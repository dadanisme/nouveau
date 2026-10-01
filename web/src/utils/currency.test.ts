import { describe, expect, it } from 'vitest';

import {
  currencyDecimals,
  formatAmount,
  formatForeignAmount,
  formatSignedAmount,
  getCurrencySymbol,
  parseAmountInput,
  toAmountInput,
} from '@/utils/currency';

describe('currencyDecimals', () => {
  it('is 0 for currencies without minor units and 2 otherwise', () => {
    expect(currencyDecimals('IDR')).toBe(0);
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('USD')).toBe(2);
  });
});

describe('formatting', () => {
  it('uses the currency symbol with Indonesian digit grouping, like mobile', () => {
    expect(getCurrencySymbol('IDR')).toBe('Rp');
    expect(formatAmount(1250000, 'IDR')).toBe('Rp1.250.000');
    expect(formatAmount(0, 'IDR')).toBe('Rp0');
    expect(formatAmount(999, 'IDR')).toBe('Rp999');
  });

  it('rounds to the currency decimals', () => {
    expect(formatAmount(1250000.6, 'IDR')).toBe('Rp1.250.001');
    expect(formatAmount(1234.5, 'USD')).toBe('$1.234,5');
    expect(formatAmount(1234.567, 'USD')).toBe('$1.234,57');
  });

  it('falls back to the code for an unknown currency', () => {
    expect(getCurrencySymbol('not-a-code')).toBe('not-a-code');
  });

  it('signs by transaction type', () => {
    expect(formatSignedAmount(15000, 'expense', 'IDR')).toBe('-Rp15.000');
    expect(formatSignedAmount(15000, 'income', 'IDR')).toBe('+Rp15.000');
  });

  it('formats foreign amounts in their own currency', () => {
    expect(formatForeignAmount(11806.97, 'USD')).toBe('$11,806.97');
  });

  it('builds the plain string an amount editor starts with', () => {
    expect(toAmountInput(1250000, 0)).toBe('1250000');
    expect(toAmountInput(12.5, 2)).toBe('12.5');
    expect(toAmountInput(12.345, 2)).toBe('12.35');
  });
});

describe('parseAmountInput', () => {
  it('parses plain digits', () => {
    expect(parseAmountInput('15000', 0)).toBe(15000);
    expect(parseAmountInput(' 15000 ', 0)).toBe(15000);
    expect(parseAmountInput('15000', 2)).toBe(15000);
  });

  it('ignores a currency prefix', () => {
    expect(parseAmountInput('Rp15.000', 0)).toBe(15000);
    expect(parseAmountInput('Rp 15.000', 0)).toBe(15000);
    expect(parseAmountInput('$12.50', 2)).toBe(12.5);
  });

  it('treats separators as grouping for zero-decimal currencies', () => {
    expect(parseAmountInput('1.250.000', 0)).toBe(1250000);
    expect(parseAmountInput('1,250,000', 0)).toBe(1250000);
    expect(parseAmountInput('15.000', 0)).toBe(15000);
  });

  it('rejects fractions for zero-decimal currencies instead of guessing', () => {
    expect(parseAmountInput('12.5', 0)).toBeNull();
    expect(parseAmountInput('1500,50', 0)).toBeNull();
    expect(parseAmountInput('1.25.000', 0)).toBeNull();
  });

  it('reads decimals for currencies that have them', () => {
    expect(parseAmountInput('12.5', 2)).toBe(12.5);
    expect(parseAmountInput('12,5', 2)).toBe(12.5);
    expect(parseAmountInput('1250.50', 2)).toBe(1250.5);
    expect(parseAmountInput('1,250.50', 2)).toBe(1250.5);
    expect(parseAmountInput('1.250,50', 2)).toBe(1250.5);
    expect(parseAmountInput('1,250', 2)).toBe(1250);
    expect(parseAmountInput('1.250', 2)).toBe(1.25);
    expect(parseAmountInput('1,250,000', 2)).toBe(1250000);
    expect(parseAmountInput('1.250.000', 2)).toBe(1250000);
  });

  it('rounds to the currency decimals', () => {
    expect(parseAmountInput('12.345', 2)).toBe(12.35);
  });

  it('rejects empty, zero, negative and malformed input', () => {
    expect(parseAmountInput('', 0)).toBeNull();
    expect(parseAmountInput('0', 0)).toBeNull();
    expect(parseAmountInput('0.00', 2)).toBeNull();
    expect(parseAmountInput('-500', 0)).toBeNull();
    expect(parseAmountInput('abc', 0)).toBeNull();
    expect(parseAmountInput('12abc', 0)).toBeNull();
    expect(parseAmountInput('12.', 2)).toBeNull();
    expect(parseAmountInput('1.2,3.4', 2)).toBeNull();
    expect(parseAmountInput('1.25,50', 2)).toBeNull();
    expect(parseAmountInput('1,2,3', 2)).toBeNull();
  });
});
