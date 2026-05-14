import { useCallback, useMemo, useState } from 'react';

import { colors } from '@/constants/colors';
import { useSession } from '@/hooks/use-auth';
import { useTransactions, type TransactionWithCategory } from '@/hooks/use-transactions';
import i18n from '@/lib/i18n';
import { getDateLocale } from '@/lib/i18n';
import { k } from '@/locales/keys';

export interface TransactionGroup {
  dateKey: string;
  dateLabel: string;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}

export interface CategorySpend {
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export type FilterType = 'all' | 'income' | 'expense';

export function useTransactionsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Unfiltered query for totals (deduplicated with filtered when activeFilter === 'all')
  const allQuery = useTransactions(userId, viewYear, viewMonth);

  // Filtered query for display list
  const filterType = activeFilter === 'all' ? undefined : activeFilter;
  const filteredQuery = useTransactions(userId, viewYear, viewMonth, filterType);

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

  const totals = useMemo(() => {
    if (!allTransactions) return { income: 0, expense: 0 };
    return allTransactions.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [allTransactions]);

  const expenseCategoryBreakdown = useMemo((): CategorySpend[] => {
    if (!allTransactions) return [];
    const expenseTotal = allTransactions.reduce(
      (sum, tx) => (tx.type === 'expense' ? sum + tx.amount : sum),
      0,
    );
    if (expenseTotal === 0) return [];

    // Aggregate by category
    const categoryMap: Record<string, { name: string; color: string; amount: number }> = {};
    for (const tx of allTransactions) {
      if (tx.type !== 'expense') continue;
      const catId = tx.category.id;
      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: tx.category.name, color: tx.category.color, amount: 0 };
      }
      categoryMap[catId].amount += tx.amount;
    }

    // Sort by amount descending
    const sorted = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

    const MAX_CATEGORIES = 4;
    if (sorted.length <= MAX_CATEGORIES) {
      return sorted.map((cat) => ({
        ...cat,
        percentage: (cat.amount / expenseTotal) * 100,
      }));
    }

    // Top 4 + Others
    const top = sorted.slice(0, MAX_CATEGORIES);
    const othersAmount = sorted.slice(MAX_CATEGORIES).reduce((sum, cat) => sum + cat.amount, 0);
    return [
      ...top.map((cat) => ({
        ...cat,
        percentage: (cat.amount / expenseTotal) * 100,
      })),
      {
        name: i18n.t(k.transactions.others),
        color: colors.gray[400],
        amount: othersAmount,
        percentage: (othersAmount / expenseTotal) * 100,
      },
    ];
  }, [allTransactions]);

  const groupedTransactions = useMemo((): TransactionGroup[] => {
    if (!filteredTransactions) return [];
    const groups: Record<string, TransactionGroup> = {};
    for (const tx of filteredTransactions) {
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
  }, [filteredTransactions]);

  const goToPreviousMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  return {
    monthLabel,
    activeFilter,
    setActiveFilter,
    totals,
    expenseCategoryBreakdown,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading: isLoadingAll || isLoadingFiltered,
    isRefreshing,
    refetch,
  };
}
