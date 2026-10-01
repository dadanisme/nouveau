import { useMemo, useState } from 'react';

import { readBreakdownOpen, writeBreakdownOpen } from '@/lib/summary-storage';
import type { TransactionWithCategory, TypeFilter } from '@/types/transaction';
import { currencyDecimals } from '@/utils/currency';
import { computeBreakdownGroups, computeSummary } from '@/utils/summary';

interface UseSummaryStripOptions {
  /** The rows the table shows (period, search and every filter applied). */
  transactions: TransactionWithCategory[];
  /** The same rows without the category filter, so a picked category keeps its neighbours. */
  breakdownTransactions: TransactionWithCategory[];
  /** The workspace's home currency; totals are rounded to its decimals. */
  homeCurrency: string | null;
  /** The toolbar's type filter, which also decides which types are broken down. */
  typeFilter: TypeFilter;
  categoryFilter: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
}

/** Totals and category breakdown for the strip above the transactions table. */
export function useSummaryStrip({
  transactions,
  breakdownTransactions,
  homeCurrency,
  typeFilter,
  categoryFilter,
  onCategoryFilterChange,
}: UseSummaryStripOptions) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(readBreakdownOpen);

  const summary = useMemo(
    () => computeSummary(transactions, homeCurrency ? currencyDecimals(homeCurrency) : undefined),
    [transactions, homeCurrency],
  );
  const breakdownGroups = useMemo(
    () => computeBreakdownGroups(breakdownTransactions, typeFilter),
    [breakdownTransactions, typeFilter],
  );

  return {
    summary,
    breakdownGroups,
    typeFilter,
    isBreakdownOpen,
    toggleBreakdown: () => {
      writeBreakdownOpen(!isBreakdownOpen);
      setIsBreakdownOpen(!isBreakdownOpen);
    },
    selectedCategoryId: categoryFilter,
    /** Filters the table to the category; a second click on the same one clears the filter. */
    toggleCategory: (categoryId: string) =>
      onCategoryFilterChange(categoryId === categoryFilter ? null : categoryId),
  };
}

export type SummaryStripState = ReturnType<typeof useSummaryStrip>;
