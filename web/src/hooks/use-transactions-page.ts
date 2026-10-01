import { useCallback, useMemo, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace-context';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import type { Category, DateRange, TransactionWithCategory, TypeFilter } from '@/types/transaction';
import {
  currentYearMonth,
  formatMonthLabel,
  formatRangeLabel,
  isSameMonth,
  monthRange,
  shiftMonth,
} from '@/utils/date';
import { filterTransactions } from '@/utils/transaction';

// Stable fallbacks: a fresh array each render would rebuild the table's row models.
const NO_TRANSACTIONS: TransactionWithCategory[] = [];
const NO_CATEGORIES: Category[] = [];

/**
 * Period, filters and data for the transactions page. The page shows one month (starting on
 * the current one) unless a custom date range is set, which overrides the month. Search and
 * the type/category filters narrow whatever period is loaded; they never widen it.
 */
export function useTransactionsPage() {
  const { currentWorkspaceId, currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();

  const [month, setMonth] = useState(currentYearMonth);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const range = useMemo(() => customRange ?? monthRange(month), [customRange, month]);

  const transactionsQuery = useTransactions(currentWorkspaceId, range);
  const categoriesQuery = useCategories(currentWorkspaceId);

  const allTransactions = transactionsQuery.data ?? NO_TRANSACTIONS;
  const categories = categoriesQuery.data ?? NO_CATEGORIES;

  const transactions = useMemo(
    () =>
      filterTransactions(allTransactions, {
        search,
        type: typeFilter,
        categoryId: categoryFilter,
      }),
    [allTransactions, search, typeFilter, categoryFilter],
  );

  // Moving by month always leaves a custom range.
  const goToMonth = useCallback((delta: number) => {
    setCustomRange(null);
    setMonth((current) => shiftMonth(current, delta));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setCustomRange(null);
    setMonth(currentYearMonth());
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter(null);
  }, []);

  const hasFilters = search.trim() !== '' || typeFilter !== 'all' || categoryFilter !== null;

  return {
    workspaceId: currentWorkspaceId,
    homeCurrency: currentWorkspace?.home_currency ?? null,
    hasWorkspace: !!currentWorkspaceId,
    isWorkspaceLoading,

    periodLabel: customRange ? formatRangeLabel(customRange) : formatMonthLabel(month),
    isCurrentMonth: !customRange && isSameMonth(month, currentYearMonth()),
    range,
    customRange,
    setCustomRange,
    goToPreviousMonth: () => goToMonth(-1),
    goToNextMonth: () => goToMonth(1),
    goToCurrentMonth,

    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    hasFilters,
    clearFilters,

    categories,
    transactions,
    /** Every transaction of the period, before search and filters. */
    periodTransactions: allTransactions,
    totalCount: allTransactions.length,
    // `isPending` stays true while the query is disabled (no workspace yet).
    isLoading: isWorkspaceLoading || (!!currentWorkspaceId && transactionsQuery.isPending),
    error: transactionsQuery.error ?? categoriesQuery.error,
    retry: () => {
      void transactionsQuery.refetch();
      void categoriesQuery.refetch();
    },
  };
}
