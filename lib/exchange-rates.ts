import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

/**
 * The latest `USD → code` rate for each of `codes`, from the USD-based `exchange_rates` table:
 * each code's newest `rate_date` on or before `onOrBefore` (`YYYY-MM-DD`). USD is always 1. A code
 * with no rate is left out, so the caller decides what a missing rate means. The table allows
 * anonymous reads. Takes the client, so scripts can run it without the app's (expo) client.
 */
export async function fetchLatestUsdRates(
  client: SupabaseClient<Database>,
  codes: readonly string[],
  onOrBefore: string,
): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  const quotes = [...new Set(codes)].filter((code) => code !== 'USD');
  if (codes.includes('USD')) rates.USD = 1;

  // One small query per code: a shared, limited one could miss a code the source skipped lately.
  await Promise.all(
    quotes.map(async (code) => {
      const { data, error } = await client
        .from('exchange_rates')
        .select('rate')
        .eq('base_currency', 'USD')
        .eq('quote_currency', code)
        .lte('rate_date', onOrBefore)
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) rates[code] = Number(data.rate);
    }),
  );
  return rates;
}
