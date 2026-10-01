import { useMemo, useState } from 'react';

import { readBreakdownOpen, writeBreakdownOpen } from '@/lib/summary-storage';
import type { TransactionType, TransactionWithCategory, TypeFilter } from '@/types/transaction';
import { currencyDecimals } from '@/utils/currency';
import { computeCategoryBreakdown, computeSummary } from '@/utils/summary';

interface UseSummaryStripOptions {
  /** The rows the table shows (period, search and every filter applied). */
  transactions: TransactionWithCategory[];
  /** The same rows without the category filter, so a picked category keeps its neighbours. */
  breakdownTransactions: TransactionWithCategory[];
  /** The workspace's home currency; totals are rounded to its decimals. */
  homeCurrency: string | null;
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
  const [chosenType, setChosenType] = useState<TransactionType>('expense');

  // A type filter leaves only one type to break down.
  const breakdownType = typeFilter === 'all' ? chosenType : typeFilter;

  const summary = useMemo(
    () => computeSummary(transactions, homeCurrency ? currencyDecimals(homeCurrency) : undefined),
    [transactions, homeCurrency],
  );
  const breakdown = useMemo(
    () => computeCategoryBreakdown(breakdownTransactions, breakdownType),
    [breakdownTransactions, breakdownType],
  );

  return {
    summary,
    breakdown,
    breakdownType,
    canChangeBreakdownType: typeFilter === 'all',
    setBreakdownType: setChosenType,
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
