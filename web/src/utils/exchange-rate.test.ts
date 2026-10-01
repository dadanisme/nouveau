import { describe, expect, it } from 'vitest';

import {
  crossRate,
  currencyOptions,
  type ExchangeRateRow,
  impliedRate,
  toHomeAmount,
} from '@/utils/exchange-rate';

// Newest first, as the query returns them.
const rows: ExchangeRateRow[] = [
  { quote_currency: 'IDR', rate: 16500, rate_date: '2026-10-01' },
  { quote_currency: 'EUR', rate: 0.9, rate_date: '2026-10-01' },
  { quote_currency: 'IDR', rate: 16000, rate_date: '2026-09-30' },
  { quote_currency: 'EUR', rate: 0.8, rate_date: '2026-09-30' },
];

describe('crossRate', () => {
  it('treats USD as 1 on either side', () => {
    expect(crossRate(rows, 'USD', 'IDR')).toBe(16500);
    expect(crossRate(rows, 'IDR', 'USD')).toBe(1 / 16500);
  });

  it('divides the target rate by the source rate for two non-USD currencies', () => {
    expect(crossRate(rows, 'EUR', 'IDR')).toBe(16500 / 0.9);
    expect(crossRate(rows, 'IDR', 'EUR')).toBe(0.9 / 16500);
  });

  it('uses the first (newest) row per currency', () => {
    expect(crossRate([...rows].reverse(), 'USD', 'IDR')).toBe(16000);
  });

  it('is null when either currency has no rate', () => {
    expect(crossRate(rows, 'GBP', 'IDR')).toBeNull();
    expect(crossRate(rows, 'EUR', 'GBP')).toBeNull();
    expect(crossRate([], 'USD', 'IDR')).toBeNull();
    expect(
      crossRate([{ quote_currency: 'IDR', rate: 0, rate_date: '2026-10-01' }], 'USD', 'IDR'),
    ).toBeNull();
  });
});

describe('impliedRate', () => {
  it('is the home amount per unit of the original amount', () => {
    expect(impliedRate({ amount: 10, home_amount: 160000 })).toBe(16000);
  });

  it('is null without an amount to divide by', () => {
    expect(impliedRate({ amount: 0, home_amount: 160000 })).toBeNull();
  });
});

describe('toHomeAmount', () => {
  it('returns the amount itself in the home currency, whatever the rate', () => {
    expect(toHomeAmount(15000, 'IDR', 'IDR', null)).toBe(15000);
    expect(toHomeAmount(15000, 'IDR', 'IDR', 2)).toBe(15000);
  });

  it('multiplies foreign amounts by the rate without rounding', () => {
    expect(toHomeAmount(12.5, 'USD', 'IDR', 16500)).toBe(206250);
    expect(toHomeAmount(3, 'USD', 'IDR', 16234.567)).toBe(3 * 16234.567);
  });

  it('is null for a foreign amount without a usable rate', () => {
    expect(toHomeAmount(10, 'USD', 'IDR', null)).toBeNull();
    expect(toHomeAmount(10, 'USD', 'IDR', undefined)).toBeNull();
    expect(toHomeAmount(10, 'USD', 'IDR', 0)).toBeNull();
  });
});

describe('currencyOptions', () => {
  it('lists the common currencies', () => {
    expect(currencyOptions('IDR')).toEqual([
      'IDR',
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'SGD',
      'AUD',
      'MYR',
    ]);
  });

  it('keeps a currency that is not in the common list', () => {
    expect(currencyOptions('CHF')).toContain('CHF');
    expect(currencyOptions('CHF')).toHaveLength(9);
  });
});
