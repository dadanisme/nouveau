import { useCallback, useMemo, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions, type TransactionWithCategory } from '@/hooks/use-transactions';
import { getDateLocale } from '@/lib/i18n';
import { computeTotals } from '@/utils/analytics';

export interface TransactionGroup {
  dateKey: string;
  dateLabel: string;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}

export type FilterType = 'all' | 'income' | 'expense';

export function useTransactionsScreen() {
  const { currentWorkspaceId } = useWorkspace();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const { year: viewYear, month: viewMonth } = view;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Unfiltered query for totals (deduplicated with filtered when activeFilter === 'all')
  const allQuery = useTransactions(currentWorkspaceId, viewYear, viewMonth);

  // Filtered query for display list
  const filterType = activeFilter === 'all' ? undefined : activeFilter;
  const filteredQuery = useTransactions(currentWorkspaceId, viewYear, viewMonth, filterType);

  // Categories for the filter sheet
  const { data: categories = [] } = useCategories(currentWorkspaceId);

  const allTransactions = allQuery.data;
  const filteredTransactions = filteredQuery.data;
  const isLoadingAll = allQuery.isLoading;
  const isLoadingFiltered = filteredQuery.isLoading;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([allQuery.refetch(), filteredQuery.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [allQuery, filteredQuery]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(getDateLocale(), {
    month: 'long',
    year: 'numeric',
  });

  const totals = useMemo(() => computeTotals(allTransactions), [allTransactions]);
  const balance = totals.income - totals.expense;

  const groupedTransactions = useMemo((): TransactionGroup[] => {
    if (!filteredTransactions) return [];
    const displayTransactions = categoryFilter
      ? filteredTransactions.filter((tx) => tx.category.id === categoryFilter)
      : filteredTransactions;
    const groups: Record<string, TransactionGroup> = {};
    for (const tx of displayTransactions) {
      const dateKey = tx.date.split('T')[0];
      if (!groups[dateKey]) {
        const date = new Date(dateKey + 'T00:00:00');
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        groups[dateKey] = {
          dateKey,
          dateLabel: `${dd}/${mm}/${yyyy}`,
          income: 0,
          expense: 0,
          transactions: [],
        };
      }
      if (tx.type === 'income') groups[dateKey].income += tx.amount;
      else groups[dateKey].expense += tx.amount;
      groups[dateKey].transactions.push(tx);
    }
    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredTransactions, categoryFilter]);

  const goToPreviousMonth = useCallback(() => {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  }, []);

  const goToNextMonth = useCallback(() => {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  }, []);

  return {
    view,
    monthLabel,
    activeFilter,
    setActiveFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    filterSheetVisible,
    setFilterSheetVisible,
    totals,
    balance,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading: isLoadingAll || isLoadingFiltered,
    isRefreshing,
    refetch,
  };
}
