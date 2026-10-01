/** The `exchange_rates` table stores every rate against this base. */
export const RATE_BASE_CURRENCY = 'USD';

/** Same list mobile offers for a workspace's home currency (`constants/currencies.ts`). */
export const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'MYR'] as const;

export interface ExchangeRateRow {
  quote_currency: string;
  rate: number;
  rate_date: string;
}

/** The currencies a transaction can be switched to: the common ones plus its current one. */
export function currencyOptions(current: string): string[] {
  return COMMON_CURRENCIES.includes(current as (typeof COMMON_CURRENCIES)[number])
    ? [...COMMON_CURRENCIES]
    : [...COMMON_CURRENCIES, current];
}

/**
 * Cross rate from `from` to `to` out of USD-based rows, exactly as mobile's `useExchangeRate`:
 * rate(from→to) = rate(USD→to) / rate(USD→from). `rows` must be newest first, so the first
 * row per quote is its latest rate. Null when either side has no rate.
 */
export function crossRate(rows: ExchangeRateRow[], from: string, to: string): number | null {
  const latestRate = (code: string) =>
    code === RATE_BASE_CURRENCY ? 1 : rows.find((row) => row.quote_currency === code)?.rate;
  const fromRate = latestRate(from);
  const toRate = latestRate(to);
  if (!fromRate || !toRate) return null;
  return toRate / fromRate;
}

/** The rate a stored conversion implies (home per unit of original), or null if it has none. */
export function impliedRate(tx: { amount: number; home_amount: number }): number | null {
  return tx.amount > 0 ? tx.home_amount / tx.amount : null;
}

/**
 * The home-currency value of an amount. Home-currency amounts are their own home amount.
 * Foreign amounts are multiplied by the rate without rounding, as mobile stores them; null
 * when there is no usable rate.
 */
export function toHomeAmount(
  amount: number,
  currency: string,
  homeCurrency: string,
  rate: number | null | undefined,
): number | null {
  if (currency === homeCurrency) return amount;
  if (!rate) return null;
  return amount * rate;
}
