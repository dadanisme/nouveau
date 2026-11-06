/**
 * The home currencies the app offers. Each has a rate in the `exchange_rates` table (USD-based),
 * which the guest upload (#100) converts with, so a missing rate can only be a passing gap.
 */
export const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'MYR'] as const;

export type CommonCurrency = (typeof COMMON_CURRENCIES)[number];

/** The workspaces' `home_currency` column default, used until the workspace has loaded. */
export const DEFAULT_HOME_CURRENCY = 'IDR';
