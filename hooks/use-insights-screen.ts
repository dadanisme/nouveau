import { useNavigation, useRouter, type NativeStackNavigationProp } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useTransactions, useTransactionsByYear } from '@/hooks/use-transactions';
import {
  computeExpenseBreakdown,
  computeMonthlyTrend,
  computeTotals,
  type CategorySpend,
  type MonthlyPoint,
} from '@/utils/analytics';
import { formatPeriodLabel, type PeriodMode } from '@/utils/date';

export type InsightsMode = PeriodMode;

type InsightsParams = { year?: string; month?: string };

/**
 * @param requestedYear / requestedMonth The period asked for through the route params
 * (e.g. tapping the summary card on Transactions), or null to open on the current month.
 */
export function useInsightsScreen(requestedYear: number | null, requestedMonth: number | null) {
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
  const navigation = useNavigation<NativeStackNavigationProp<{ insights: InsightsParams }>>();

  const [mode, setMode] = useState<InsightsMode>('month');
  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: requestedYear ?? now.getFullYear(), month: requestedMonth ?? now.getMonth() };
  });
  const { year: viewYear, month: viewMonth } = view;

  // Insights is a tab, so it stays mounted: a later request for a period arrives as new
  // params on this same screen. Jump to it when the params change (state adjusted during
  // render), then clear the params so requesting the same month again is still a change.
  const requestKey =
    requestedYear !== null && requestedMonth !== null ? `${requestedYear}-${requestedMonth}` : null;
  const [handledRequestKey, setHandledRequestKey] = useState(requestKey);
  if (requestKey !== handledRequestKey) {
    setHandledRequestKey(requestKey);
    if (requestedYear !== null && requestedMonth !== null) {
      setMode('month');
      setView({ year: requestedYear, month: requestedMonth });
    }
  }

  useEffect(() => {
    if (requestKey !== null) navigation.setParams({ year: undefined, month: undefined });
  }, [requestKey, navigation]);

  // Month mode shares the home screen's query cache (same key) — opening
  // insights on the month already shown at home is an instant cache hit.
  // The year query only fires in year mode (a full year of rows is not
  // worth prefetching for users who never toggle).
  const monthQuery = useTransactions(currentWorkspaceId, viewYear, viewMonth);
  const yearQuery = useTransactionsByYear(currentWorkspaceId, viewYear, mode === 'year');

  const activeTransactions = mode === 'month' ? monthQuery.data : yearQuery.data;

  const totals = useMemo(() => computeTotals(activeTransactions), [activeTransactions]);
  const balance = totals.income - totals.expense;

  const categoryBreakdown = useMemo(
    (): CategorySpend[] => computeExpenseBreakdown(activeTransactions),
    [activeTransactions],
  );

  const monthlyTrend = useMemo(
    (): MonthlyPoint[] => computeMonthlyTrend(yearQuery.data),
    [yearQuery.data],
  );

  // Category drill-down: a sheet route that re-reads the same period from the query cache
  function openCategory(category: CategorySpend) {
    if (!category.id) return;
    router.push({
      pathname: '/category-transactions',
      params: {
        categoryId: category.id,
        mode,
        year: String(viewYear),
        month: String(viewMonth),
      },
    });
  }

  const periodLabel = formatPeriodLabel(mode, viewYear, viewMonth);

  // Highlight the current month in the trend chart only when viewing the current year
  const now = new Date();
  const highlightMonth = viewYear === now.getFullYear() ? now.getMonth() : undefined;

  const goToPrevious = useCallback(() => {
    setView(({ year, month }) => {
      if (mode === 'year') return { year: year - 1, month };
      return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
    });
  }, [mode]);

  const goToNext = useCallback(() => {
    setView(({ year, month }) => {
      if (mode === 'year') return { year: year + 1, month };
      return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
    });
  }, [mode]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await (mode === 'year' ? yearQuery.refetch() : monthQuery.refetch());
    } finally {
      setIsRefreshing(false);
    }
  }, [mode, monthQuery, yearQuery]);

  return {
    mode,
    setMode,
    periodLabel,
    totals,
    balance,
    categoryBreakdown,
    monthlyTrend,
    highlightMonth,
    openCategory,
    goToPrevious,
    goToNext,
    isLoading: mode === 'month' ? monthQuery.isLoading : yearQuery.isLoading,
    isRefreshing,
    refetch,
  };
}
