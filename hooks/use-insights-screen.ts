import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import {
  useTransactions,
  useTransactionsByYear,
  type TransactionWithCategory,
} from '@/hooks/use-transactions';
import { useUpdateTransaction } from '@/hooks/use-update-transaction';
import { getDateLocale } from '@/lib/i18n';
import type { Tables } from '@/types/supabase';
import {
  computeExpenseBreakdown,
  computeMonthlyTrend,
  computeTotals,
  type CategorySpend,
  type MonthlyPoint,
} from '@/utils/analytics';

export type InsightsMode = 'month' | 'year';

type InsightsParams = { year?: string; month?: string };

/**
 * @param requestedYear / requestedMonth The period asked for through the route params
 * (e.g. tapping the summary card on Transactions), or null to open on the current month.
 */
export function useInsightsScreen(requestedYear: number | null, requestedMonth: number | null) {
  const { currentWorkspaceId } = useWorkspace();
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

  // Category drill-down: transactions for the tapped category within the active period
  const [selectedCategory, setSelectedCategory] = useState<CategorySpend | null>(null);

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory?.id || !activeTransactions) return [];
    return activeTransactions.filter((tx) => tx.category.id === selectedCategory.id);
  }, [selectedCategory, activeTransactions]);

  // Close the drill-down once its category has no transactions left
  // (e.g. the last one was re-categorized or deleted)
  useEffect(() => {
    if (selectedCategory && activeTransactions && selectedCategoryTransactions.length === 0) {
      setSelectedCategory(null);
    }
  }, [selectedCategory, activeTransactions, selectedCategoryTransactions]);

  // Quick re-categorize: tapping a transaction in the drill-down opens the category picker
  const { data: allCategories = [] } = useCategories(currentWorkspaceId);
  const updateTransaction = useUpdateTransaction();
  const [recategorizeTarget, setRecategorizeTarget] = useState<TransactionWithCategory | null>(
    null,
  );

  const recategorizeOptions = useMemo(
    () => allCategories.filter((category) => category.type === recategorizeTarget?.type),
    [allCategories, recategorizeTarget],
  );

  const recategorize = useCallback(
    (category: Tables<'categories'>) => {
      if (recategorizeTarget && category.id !== recategorizeTarget.category.id) {
        updateTransaction.mutate({ id: recategorizeTarget.id, category_id: category.id });
      }
      setRecategorizeTarget(null);
    },
    [recategorizeTarget, updateTransaction],
  );

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(getDateLocale(), {
    month: 'long',
    year: 'numeric',
  });
  const periodLabel = mode === 'month' ? monthLabel : String(viewYear);

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
    selectedCategory,
    setSelectedCategory,
    selectedCategoryTransactions,
    recategorizeTarget,
    setRecategorizeTarget,
    recategorizeOptions,
    recategorize,
    goToPrevious,
    goToNext,
    isLoading: mode === 'month' ? monthQuery.isLoading : yearQuery.isLoading,
    isRefreshing,
    refetch,
  };
}
