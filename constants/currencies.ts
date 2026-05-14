export const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'MYR'] as const;

export type CommonCurrency = (typeof COMMON_CURRENCIES)[number];
