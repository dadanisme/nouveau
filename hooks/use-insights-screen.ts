import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
  type NativeStackNavigationProp,
} from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { usePeriodNavigation } from '@/hooks/use-period-navigation';
import { useTransactions, useTransactionsByYear } from '@/hooks/use-transactions';
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeTotals,
  type TransactionType,
} from '@/utils/analytics';
import { shiftPeriod, type PeriodMode } from '@/utils/date';
import { buildInsightsSummary } from '@/utils/insights-summary';
import { formatPeriodSummary, toSpendBreakdownRows } from '@/utils/period-summary';
import { joinWithDot } from '@/utils/string';

export type InsightsMode = PeriodMode;

/** `mode` asks Insights to switch to that mode once (Transactions' "View insights" sends month). */
export type InsightsParams = { mode?: InsightsMode };

/** A category row: its symbol, "Rp1.2M · 34%" and the share for the bar. */
export interface InsightsCategoryRow {
  key: string;
  title: string;
  symbol: FormSymbol;
  /** Amount and share, e.g. "Rp1.2M · 34%". */
  value: string;
  /** Share of the period's spending (or income), 0–1. */
  share: number;
  categoryId?: string;
}

/**
 * Insights screen: the period (a month, or a year in year mode) with its native header controls,
 * a headline compared with the previous period, the period summary, the monthly trend (year mode),
 * and spending and income by category with their drill-down.
 * The period is shared with Transactions (`PeriodProvider`), so either tab's change shows here.
 */
export function useInsightsScreen() {
  // `locale` follows the in-app language, so the memoized amounts rebuild when it changes.
  const { locale } = useLanguage();
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<{ insights: InsightsParams }>>();
  const { mode: requestedMode } = useLocalSearchParams<InsightsParams>();

  // Month / year mode is Insights' own; the period itself is shared with Transactions.
  const [mode, setMode] = useState<InsightsMode>(requestedMode ?? 'month');

  // Insights is a tab, so it stays mounted: a mode request arrives as a new param on this same
  // screen. Switch to it when the param changes (state adjusted during render), then clear the
  // param so the next request is still a change.
  const [handledMode, setHandledMode] = useState(requestedMode);
  if (requestedMode !== handledMode) {
    setHandledMode(requestedMode);
    if (requestedMode) setMode(requestedMode);
  }

  useEffect(() => {
    if (requestedMode) navigation.setParams({ mode: undefined });
  }, [requestedMode, navigation]);
  const nav = usePeriodNavigation(mode);
  const { year, month } = nav.period;

  // Month mode shares the Transactions screen's query cache (same key), so opening Insights on
  // the month shown there is an instant cache hit. The year query only fires in year mode.
  const monthQuery = useTransactions(currentWorkspaceId, year, month);
  const yearQuery = useTransactionsByYear(currentWorkspaceId, year, mode === 'year');
  const activeQuery = mode === 'month' ? monthQuery : yearQuery;
  const transactions = activeQuery.data;

  // The previous month (or year) for the headline's comparison. The previous month's query is
  // the one Transactions uses for that month, so stepping back a month is a cache hit.
  const previous = shiftPeriod(mode, nav.period, -1);
  const previousMonthQuery = useTransactions(
    mode === 'month' ? currentWorkspaceId : null,
    previous.year,
    previous.month,
  );
  const previousYearQuery = useTransactionsByYear(
    currentWorkspaceId,
    previous.year,
    mode === 'year',
  );
  const previousQuery = mode === 'month' ? previousMonthQuery : previousYearQuery;
  const previousTransactions = previousQuery.data;

  const { data: categories = [] } = useCategories(currentWorkspaceId);

  const totals = useMemo(() => computeTotals(transactions), [transactions]);
  const summary = useMemo(() => formatPeriodSummary(totals, locale), [totals, locale]);

  const headline = useMemo(
    () =>
      buildInsightsSummary(
        { mode, period: { year, month }, current: transactions, previous: previousTransactions },
        locale,
      ),
    [mode, year, month, transactions, previousTransactions, locale],
  );

  const spendingRows = useMemo(
    () => toCategoryRows(transactions, 'expense', categories, locale),
    [transactions, categories, locale],
  );
  const incomeRows = useMemo(
    () => toCategoryRows(transactions, 'income', categories, locale),
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
    await Promise.all([activeQuery.refetch(), previousQuery.refetch()]);
  }

  // Wait for the previous period too, so the headline doesn't gain its comparison after showing.
  const isLoading = activeQuery.isLoading || previousQuery.isLoading;

  return {
    nav,
    mode,
    setMode,
    headline,
    summary,
    spendingRows,
    incomeRows,
    monthlyTrend,
    highlightMonth,
    isLoading,
    /** The period has no transactions at all. */
    isEmpty: !isLoading && (transactions?.length ?? 0) === 0,
    openCategory,
    refresh,
  };
}

/** A breakdown's rows for one type: symbol, "Rp1.2M · 34%" and the share for the bar. */
function toCategoryRows(
  transactions: Parameters<typeof computeCategoryBreakdown>[0],
  type: TransactionType,
  categories: Parameters<typeof toSpendBreakdownRows>[1],
  locale: string,
): InsightsCategoryRow[] {
  return toSpendBreakdownRows(computeCategoryBreakdown(transactions, type), categories, {
    locale,
  }).map((row) => ({
    key: row.key,
    title: row.title,
    symbol: row.symbol,
    value: joinWithDot([row.amount, row.shareLabel]),
    share: row.share,
    categoryId: row.categoryId,
  }));
}
