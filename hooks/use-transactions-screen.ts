import { useCallback, useMemo, useState } from 'react';

import { useSession } from '@/hooks/use-auth';
import { useTransactions, type TransactionWithCategory } from '@/hooks/use-transactions';

export interface TransactionGroup {
  dateKey: string;
  dateLabel: string;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
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

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
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

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return {
    monthLabel,
    activeFilter,
    setActiveFilter,
    totals,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading: isLoadingAll || isLoadingFiltered,
    isRefreshing,
    refetch,
  };
}
