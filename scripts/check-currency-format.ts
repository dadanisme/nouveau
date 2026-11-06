/**
 * Checks the home-currency formatting core (`utils/currency-format.ts`, #111):
 * - IDR renders exactly as before the currency was threaded through, in en and id (compared with
 *   a frozen copy of the old formatters and with literal strings);
 * - USD, EUR, JPY and SGD get their own symbol and decimals.
 *
 * Run: bun scripts/check-currency-format.ts (exits 1 on any failure).
 */
import en from '../locales/en';
import id from '../locales/id';
import {
  currencyDecimals,
  currencySymbolIn,
  formatCompactHomeAmountIn,
  formatHomeAmountIn,
  type CompactSuffixes,
  separatorsIn,
} from '../utils/currency-format';

const LOCALES = { en: { tag: 'en-US', strings: en }, id: { tag: 'id-ID', strings: id } } as const;
type AppLocale = keyof typeof LOCALES;

const suffixes = (locale: AppLocale): CompactSuffixes => LOCALES[locale].strings.currency;
const full = (value: number, currency: string, locale: AppLocale) =>
  formatHomeAmountIn(value, currency, LOCALES[locale].tag);
const compact = (value: number, currency: string, locale: AppLocale) =>
  formatCompactHomeAmountIn(value, currency, LOCALES[locale].tag, suffixes(locale));

// The formatters as they were before #111 (prefix "Rp" in both locales, Indonesian grouping).
function legacyFormatCurrency(value: number): string {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}
function legacyFormatCompactAmount(value: number, locale: AppLocale): string {
  const prefix = 'Rp';
  const { billion, million, thousand } = suffixes(locale);
  if (value >= 1_000_000_000) {
    const c = value / 1_000_000_000;
    return c % 1 === 0
      ? `${prefix}${c}${billion}`
      : `${prefix}${parseFloat(c.toFixed(1))}${billion}`;
  }
  if (value >= 1_000_000) {
    const c = value / 1_000_000;
    return c % 1 === 0
      ? `${prefix}${c}${million}`
      : `${prefix}${parseFloat(c.toFixed(1))}${million}`;
  }
  if (value >= 1_000) {
    const c = value / 1_000;
    return c % 1 === 0
      ? `${prefix}${c}${thousand}`
      : `${prefix}${parseFloat(c.toFixed(1))}${thousand}`;
  }
  return `${prefix}${Math.round(value)}`;
}

let failures = 0;
let passes = 0;
function expect(label: string, actual: string | number, expected: string | number) {
  if (actual === expected) {
    passes++;
  } else {
    failures++;
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  }
}

// IDR: byte-identical to the old output.
const IDR_VALUES = [
  0, 1, 950, 999, 999.4, 999.6, 1000, 1500, 12_345, 999_999, 1_000_000, 1_234_567, 1_500_000,
  25_000_000, 999_999_999, 1_000_000_000, 1_250_000_000, 12_345_678_901, -950, -1500, -1_500_000,
  -1_250_000_000, 0.5, 2.5,
];
for (const locale of ['en', 'id'] as const) {
  for (const value of IDR_VALUES) {
    expect(`IDR full ${value} ${locale}`, full(value, 'IDR', locale), legacyFormatCurrency(value));
    expect(
      `IDR compact ${value} ${locale}`,
      compact(value, 'IDR', locale),
      legacyFormatCompactAmount(value, locale),
    );
  }
}

// IDR literals, so a change to the legacy copy can't hide a regression.
const IDR_LITERALS: [number, AppLocale, string, string][] = [
  [0, 'en', 'Rp0', 'Rp0'],
  [950, 'en', 'Rp950', 'Rp950'],
  [1500, 'en', 'Rp1.500', 'Rp1.5K'],
  [1500, 'id', 'Rp1.500', 'Rp1.5Rb'],
  [1_500_000, 'en', 'Rp1.500.000', 'Rp1.5M'],
  [1_500_000, 'id', 'Rp1.500.000', 'Rp1.5Jt'],
  [1_200_000, 'en', 'Rp1.200.000', 'Rp1.2M'],
  [1_200_000, 'id', 'Rp1.200.000', 'Rp1.2Jt'],
  [1_250_000_000, 'en', 'Rp1.250.000.000', 'Rp1.3B'],
  [1_250_000_000, 'id', 'Rp1.250.000.000', 'Rp1.3M'],
  [-1500, 'en', 'Rp-1.500', 'Rp-1500'],
];
for (const [value, locale, wantFull, wantCompact] of IDR_LITERALS) {
  expect(`IDR literal full ${value} ${locale}`, full(value, 'IDR', locale), wantFull);
  expect(`IDR literal compact ${value} ${locale}`, compact(value, 'IDR', locale), wantCompact);
}

// Other currencies: symbol, decimals and grouping.
expect('decimals IDR', currencyDecimals('IDR'), 0);
expect('decimals JPY', currencyDecimals('JPY'), 0);
expect('decimals USD', currencyDecimals('USD'), 2);
expect('decimals EUR', currencyDecimals('EUR'), 2);
expect('decimals SGD', currencyDecimals('SGD'), 2);

const SYMBOLS: [string, string][] = [
  ['IDR', 'Rp'],
  ['USD', '$'],
  ['EUR', '€'],
  ['JPY', '¥'],
  ['SGD', 'S$'],
  ['GBP', '£'],
  ['AUD', 'A$'],
  ['MYR', 'RM'],
];
for (const [currency, symbol] of SYMBOLS) {
  for (const locale of ['en', 'id'] as const) {
    expect(`symbol ${currency} ${locale}`, currencySymbolIn(currency, LOCALES[locale].tag), symbol);
  }
}

const OTHERS: [number, string, AppLocale, string, string][] = [
  [1500, 'USD', 'en', '$1,500.00', '$1.5K'],
  [1500, 'USD', 'id', '$1.500,00', '$1.5Rb'],
  [25, 'USD', 'en', '$25.00', '$25'],
  [12.5, 'USD', 'en', '$12.50', '$12.50'],
  [12.5, 'USD', 'id', '$12,50', '$12,50'],
  [1_234_567.89, 'USD', 'en', '$1,234,567.89', '$1.2M'],
  [0, 'USD', 'en', '$0.00', '$0'],
  [1500, 'EUR', 'en', '€1,500.00', '€1.5K'],
  [9.99, 'EUR', 'id', '€9,99', '€9,99'],
  [1500, 'JPY', 'en', '¥1,500', '¥1.5K'],
  [950.6, 'JPY', 'en', '¥951', '¥951'],
  [1_500_000, 'JPY', 'id', '¥1.500.000', '¥1.5Jt'],
  [1500, 'SGD', 'en', 'S$1,500.00', 'S$1.5K'],
  [0.5, 'SGD', 'en', 'S$0.50', 'S$0.50'],
];
for (const [value, currency, locale, wantFull, wantCompact] of OTHERS) {
  expect(`${currency} full ${value} ${locale}`, full(value, currency, locale), wantFull);
  expect(`${currency} compact ${value} ${locale}`, compact(value, currency, locale), wantCompact);
}

// Separators are fixed per app language, never read from Intl.formatToParts (unsupported by
// Hermes on iOS), and the home-currency core must not depend on it for symbols either.
expect(
  'separators en',
  JSON.stringify(separatorsIn('en-US')),
  JSON.stringify({ group: ',', decimal: '.' }),
);
expect(
  'separators id',
  JSON.stringify(separatorsIn('id-ID')),
  JSON.stringify({ group: '.', decimal: ',' }),
);
{
  const realFormat = Intl.NumberFormat.prototype.formatToParts;
  Intl.NumberFormat.prototype.formatToParts = () => {
    throw new Error('formatToParts unavailable (simulating Hermes on iOS)');
  };
  try {
    for (const [currency, symbol] of SYMBOLS) {
      expect(
        `symbol ${currency} without formatToParts`,
        currencySymbolIn(currency, 'en-US'),
        symbol,
      );
    }
    expect('USD full without formatToParts', full(1500.5, 'USD', 'en'), '$1,500.50');
  } finally {
    Intl.NumberFormat.prototype.formatToParts = realFormat;
  }
}

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
