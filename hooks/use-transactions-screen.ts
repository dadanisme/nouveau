import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import type { TransactionRowData } from '@/components/transaction-row-types';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { usePeriodNavigation } from '@/hooks/use-period-navigation';
import { useTransactions } from '@/hooks/use-transactions';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';
import { computeExpenseBreakdown, computeTotals } from '@/utils/analytics';
import { formatCompactAmount } from '@/utils/currency';
import { formatDayLabel } from '@/utils/date';
import { formatPeriodSummary, toSpendBreakdownRows } from '@/utils/period-summary';
import { joinWithDot } from '@/utils/string';
import { groupTransactionsByDay, toTransactionRowData } from '@/utils/transaction';

export type FilterType = 'all' | 'income' | 'expense';

export interface CategoryFilterGroup {
  type: 'expense' | 'income';
  categories: Tables<'categories'>[];
}

/** One day section of the list. */
export interface TransactionDaySection {
  dateKey: string;
  /** "Today", "Yesterday" or "Monday, March 3". */
  title: string;
  /** The day's totals, e.g. "Spent Rp120K · Received Rp50K". */
  footer: string;
  rows: TransactionRowData[];
}

/** Top categories shown before the rest fold into "Others". */
const BREAKDOWN_TOP_CATEGORIES = 4;

/**
 * Transactions screen: the month (with its native header controls), filters, the month summary
 * and spend breakdown, the day sections and the row actions.
 */
export function useTransactionsScreen() {
  const router = useRouter();
  // `t` and `locale` follow the in-app language, so the memoized labels and amounts rebuild when
  // it changes.
  const { t, locale } = useLanguage();
  const { currentWorkspaceId } = useWorkspace();
  const nav = usePeriodNavigation('month');
  const { year, month } = nav.period;

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Category IDs are workspace-scoped — drop the filter when switching workspaces
  useEffect(() => {
    setCategoryFilter(null);
  }, [currentWorkspaceId]);

  // Unfiltered query for totals (deduplicated with filtered when activeFilter === 'all')
  const allQuery = useTransactions(currentWorkspaceId, year, month);

  // Filtered query for display list
  const filterType = activeFilter === 'all' ? undefined : activeFilter;
  const filteredQuery = useTransactions(currentWorkspaceId, year, month, filterType);

  // Categories for the filter menu and the breakdown symbols
  const { data: categories = [] } = useCategories(currentWorkspaceId);

  const allTransactions = allQuery.data;
  const filteredTransactions = filteredQuery.data;

  async function refresh() {
    await Promise.all([allQuery.refetch(), filteredQuery.refetch()]);
  }

  const totals = useMemo(() => computeTotals(allTransactions), [allTransactions]);
  const summary = useMemo(() => formatPeriodSummary(totals, locale), [totals, locale]);

  const breakdown = useMemo(
    () =>
      toSpendBreakdownRows(
        computeExpenseBreakdown(allTransactions, BREAKDOWN_TOP_CATEGORIES),
        categories,
        { locale, othersTitle: t(k.transactions.others) },
      ),
    [allTransactions, categories, t, locale],
  );

  const daySections = useMemo((): TransactionDaySection[] => {
    if (!filteredTransactions) return [];
    const displayTransactions = categoryFilter
      ? filteredTransactions.filter((tx) => tx.category.id === categoryFilter)
      : filteredTransactions;
    const now = new Date();
    const relative = { today: t(k.transactions.today), yesterday: t(k.transactions.yesterday) };
    return groupTransactionsByDay(displayTransactions).map((day) => ({
      dateKey: day.dateKey,
      title: formatDayLabel(day.dateKey, now, relative),
      footer: joinWithDot([
        day.expense > 0
          ? t(k.transactions.daySpent, { amount: formatCompactAmount(day.expense, locale) })
          : null,
        day.income > 0
          ? t(k.transactions.dayReceived, { amount: formatCompactAmount(day.income, locale) })
          : null,
      ]),
      rows: day.transactions.map((tx) => toTransactionRowData(tx, { locale })),
    }));
  }, [filteredTransactions, categoryFilter, t, locale]);

  // Category filter options, one group per type. With Type = All both types show, so they're
  // grouped (an "Other" exists in each); with a type on, only that type's categories can match.
  const categoryGroups = useMemo(
    (): CategoryFilterGroup[] =>
      (['expense', 'income'] as const)
        .filter((type) => activeFilter === 'all' || activeFilter === type)
        .map((type) => ({ type, categories: categories.filter((c) => c.type === type) }))
        .filter((group) => group.categories.length > 0),
    [categories, activeFilter],
  );

  // Picking a type drops a category filter of the other type (it could never match).
  function selectFilterType(type: FilterType) {
    setActiveFilter(type);
    const category = categories.find((c) => c.id === categoryFilter);
    if (type !== 'all' && category && category.type !== type) setCategoryFilter(null);
  }

  const { requestDelete } = useDeleteConfirmation();

  function addTransaction() {
    router.push('/add-transaction');
  }

  function editTransaction(id: string) {
    router.push({ pathname: '/add-transaction', params: { id } });
  }

  function viewProofs(transactionId: string) {
    router.push({ pathname: '/proof-viewer', params: { transactionId } });
  }

  function openInsights() {
    router.navigate({
      pathname: '/insights',
      params: { year: String(year), month: String(month) },
    });
  }

  function openCategory(categoryId: string) {
    router.push({
      pathname: '/category-transactions',
      params: { categoryId, mode: 'month', year: String(year), month: String(month) },
    });
  }

  const isLoading = allQuery.isLoading || filteredQuery.isLoading;

  return {
    nav,
    activeFilter,
    setActiveFilter: selectFilterType,
    categoryFilter,
    setCategoryFilter,
    categoryGroups,
    isFilterActive: activeFilter !== 'all' || categoryFilter !== null,
    summary,
    breakdown,
    daySections,
    isLoading,
    /** The month has no transactions at all (so no summary either). */
    isMonthEmpty: !isLoading && (allTransactions?.length ?? 0) === 0,
    refresh,
    addTransaction,
    editTransaction,
    viewProofs,
    requestDelete,
    openInsights,
    openCategory,
  };
}
