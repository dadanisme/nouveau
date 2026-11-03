import { useNavigation, useRouter, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { usePeriodNavigation } from '@/hooks/use-period-navigation';
import { useTransactions, useTransactionsByYear } from '@/hooks/use-transactions';
import { computeExpenseBreakdown, computeMonthlyTrend, computeTotals } from '@/utils/analytics';
import type { PeriodMode } from '@/utils/date';
import { formatPeriodSummary, toSpendBreakdownRows } from '@/utils/period-summary';
import { joinWithDot } from '@/utils/string';

export type InsightsMode = PeriodMode;

type InsightsParams = { year?: string; month?: string };

/** A category row: its symbol, "Rp1.2M · 34%" and the share for the bar. */
export interface InsightsCategoryRow {
  key: string;
  title: string;
  symbol: FormSymbol;
  /** Amount and share, e.g. "Rp1.2M · 34%". */
  value: string;
  /** Share of the period's spending, 0–1. */
  share: number;
  categoryId?: string;
}

/**
 * Insights screen: the period (a month, or a year in year mode) with its native header controls,
 * the period summary, the monthly trend (year mode) and spending by category with its drill-down.
 *
 * @param requestedYear / requestedMonth The month asked for through the route params (Transactions'
 * "View insights"), or null to open on the current month.
 */
export function useInsightsScreen(requestedYear: number | null, requestedMonth: number | null) {
  // `locale` follows the in-app language, so the memoized amounts rebuild when it changes.
  const { locale } = useLanguage();
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<{ insights: InsightsParams }>>();

  const [mode, setMode] = useState<InsightsMode>('month');
  const nav = usePeriodNavigation(
    mode,
    requestedYear !== null && requestedMonth !== null
      ? { year: requestedYear, month: requestedMonth }
      : undefined,
  );
  const { year, month } = nav.period;

  // Insights is a tab, so it stays mounted: a later request for a month arrives as new params on
  // this same screen. Jump to it when the params change (state adjusted during render), then clear
  // the params so requesting the same month again is still a change.
  const requestKey =
    requestedYear !== null && requestedMonth !== null ? `${requestedYear}-${requestedMonth}` : null;
  const [handledRequestKey, setHandledRequestKey] = useState(requestKey);
  if (requestKey !== handledRequestKey) {
    setHandledRequestKey(requestKey);
    if (requestedYear !== null && requestedMonth !== null) {
      setMode('month');
      nav.goTo({ year: requestedYear, month: requestedMonth });
    }
  }

  useEffect(() => {
    if (requestKey !== null) navigation.setParams({ year: undefined, month: undefined });
  }, [requestKey, navigation]);

  // Month mode shares the Transactions screen's query cache (same key), so opening Insights on
  // the month shown there is an instant cache hit. The year query only fires in year mode.
  const monthQuery = useTransactions(currentWorkspaceId, year, month);
  const yearQuery = useTransactionsByYear(currentWorkspaceId, year, mode === 'year');
  const activeQuery = mode === 'month' ? monthQuery : yearQuery;
  const transactions = activeQuery.data;

  const { data: categories = [] } = useCategories(currentWorkspaceId);

  const totals = useMemo(() => computeTotals(transactions), [transactions]);
  const summary = useMemo(() => formatPeriodSummary(totals, locale), [totals, locale]);

  const categoryRows = useMemo(
    (): InsightsCategoryRow[] =>
      toSpendBreakdownRows(computeExpenseBreakdown(transactions), categories, { locale }).map(
        (row) => ({
          key: row.key,
          title: row.title,
          symbol: row.symbol,
          value: joinWithDot([row.amount, row.shareLabel]),
          share: row.share,
          categoryId: row.categoryId,
        }),
      ),
    [transactions, categories, locale],
  );

  const monthlyTrend = useMemo(() => computeMonthlyTrend(yearQuery.data), [yearQuery.data]);

  // Highlight the current month in the trend chart only when viewing the current year
  const now = new Date();
  const highlightMonth = year === now.getFullYear() ? now.getMonth() : undefined;

  // Category drill-down: a sheet route that re-reads the same period from the query cache
  function openCategory(categoryId: string) {
    router.push({
      pathname: '/category-transactions',
      params: { categoryId, mode, year: String(year), month: String(month) },
    });
  }

  async function refresh() {
    await activeQuery.refetch();
  }

  const isLoading = activeQuery.isLoading;

  return {
    nav,
    mode,
    setMode,
    summary,
    categoryRows,
    monthlyTrend,
    highlightMonth,
    isLoading,
    /** The period has no transactions at all. */
    isEmpty: !isLoading && (transactions?.length ?? 0) === 0,
    openCategory,
    refresh,
  };
}
