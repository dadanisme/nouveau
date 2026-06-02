import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Cross rate from `from` to `to` using the USD-based `exchange_rates` table:
 * rate(from→to) = rate(USD→to) / rate(USD→from), at the most recent
 * rate_date on or before `date` (falls back per quote to the newest available).
 * Returns null when no rate is available. Disabled when from === to.
 */
export function useExchangeRate(
  from: string | undefined,
  to: string | undefined,
  date: string | undefined,
) {
  return useQuery({
    queryKey: ['exchange-rate', from, to, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('quote_currency, rate, rate_date')
        .eq('base_currency', 'USD')
        .in('quote_currency', [from!, to!])
        .lte('rate_date', date!)
        .order('rate_date', { ascending: false })
        .limit(20);
      if (error) throw error;

      // Rows are newest-first; the first match per quote is the latest rate
      const latestRate = (code: string) =>
        code === 'USD' ? 1 : data.find((row) => row.quote_currency === code)?.rate;
      const fromRate = latestRate(from!);
      const toRate = latestRate(to!);
      if (!fromRate || !toRate) return null;
      return toRate / fromRate;
    },
    enabled: !!from && !!to && !!date && from !== to,
  });
}
