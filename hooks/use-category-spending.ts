import { useMemo } from 'react';

import { useTransactions } from '@/hooks/use-transactions';

export interface HomeCategorySpend {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  amount: number;
}

const MAX_CATEGORIES = 5;

export function useCategorySpending(userId: string | undefined, year: number, month: number) {
  const query = useTransactions(userId, year, month, 'expense');

  const categorySpending = useMemo((): HomeCategorySpend[] => {
    if (!query.data) return [];

    const categoryMap: Record<
      string,
      { categoryId: string; name: string; color: string; icon: string | null; amount: number }
    > = {};

    for (const tx of query.data) {
      const catId = tx.category.id;
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          categoryId: catId,
          name: tx.category.name,
          color: tx.category.color,
          icon: tx.category.icon,
          amount: 0,
        };
      }
      categoryMap[catId].amount += tx.amount;
    }

    return Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, MAX_CATEGORIES);
  }, [query.data]);

  return {
    categorySpending,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
