import { queryOptions, useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { crossRate, RATE_BASE_CURRENCY } from '@/utils/exchange-rate';

/** Rates are published daily, so a looked-up rate is reused for a while. */
const RATE_STALE_MS = 5 * 60 * 1000;

/**
 * Cross rate from `from` to `to` on `date`, from the USD-based `exchange_rates` table. Same
 * query as mobile's `useExchangeRate`: the most recent rate on or before `date` per currency.
 * Resolves to null when either currency has no rate by then.
 */
export function exchangeRateQueryOptions(from: string, to: string, date: string) {
  return queryOptions({
    queryKey: ['exchange-rate', from, to, date] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('quote_currency, rate, rate_date')
        .eq('base_currency', RATE_BASE_CURRENCY)
        .in('quote_currency', [from, to])
        .lte('rate_date', date)
        .order('rate_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return crossRate(data, from, to);
    },
    staleTime: RATE_STALE_MS,
  });
}

/** Disabled when there is nothing to convert (`from === to`) or an argument is missing. */
export function useExchangeRate(
  from: string | undefined,
  to: string | undefined,
  date: string | undefined,
) {
  return useQuery({
    ...exchangeRateQueryOptions(from ?? '', to ?? '', date ?? ''),
    enabled: !!from && !!to && !!date && from !== to,
  });
}
