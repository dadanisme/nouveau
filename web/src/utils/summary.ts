import type { TransactionType, TransactionWithCategory } from '@/types/transaction';
import { computeTotals } from '@/utils/transaction';

export interface Summary {
  income: number;
  expense: number;
  /** Income minus expense (mobile calls this the balance). */
  net: number;
}

/**
 * Totals of the given rows in the home currency (`home_amount`). Converted amounts are stored
 * unrounded, so with `decimals` (the home currency's) income and expense are rounded first and
 * the net is their difference: the three figures shown always add up.
 */
export function computeSummary(
  transactions: TransactionWithCategory[] | undefined,
  decimals?: number,
): Summary {
  const totals = computeTotals(transactions);
  const round = (value: number) =>
    decimals === undefined ? value : Number(value.toFixed(decimals));
  const income = round(totals.income);
  const expense = round(totals.expense);
  return { income, expense, net: round(income - expense) };
}

export interface CategorySpend {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  /** Sum of `home_amount` for the category. */
  amount: number;
  /** Share of the type's total, 0–100. */
  percentage: number;
  /** Bar length relative to the largest category, 0–1 (as mobile's category bar list). */
  ratio: number;
}

/**
 * Per-category sums for one transaction type, largest first. The same aggregation as mobile's
 * `computeExpenseBreakdown` (by `home_amount`, percentage of the type's total), for either
 * type and without the "Others" bucket.
 */
export function computeCategoryBreakdown(
  transactions: TransactionWithCategory[] | undefined,
  type: TransactionType,
): CategorySpend[] {
  if (!transactions) return [];

  const byCategory = new Map<string, Omit<CategorySpend, 'percentage' | 'ratio'>>();
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    total += tx.home_amount;
    const entry = byCategory.get(tx.category.id);
    if (entry) entry.amount += tx.home_amount;
    else {
      byCategory.set(tx.category.id, {
        id: tx.category.id,
        name: tx.category.name,
        color: tx.category.color,
        icon: tx.category.icon,
        amount: tx.home_amount,
      });
    }
  }
  if (total === 0) return [];

  const sorted = [...byCategory.values()].sort(
    (a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
  );
  const largest = sorted[0].amount;
  return sorted.map((entry) => ({
    ...entry,
    percentage: (entry.amount / total) * 100,
    ratio: largest > 0 ? entry.amount / largest : 0,
  }));
}

/** Whole percent as mobile shows it, except that a non-zero share never reads "0%". */
export function formatPercentage(percentage: number): string {
  const rounded = Math.round(percentage);
  return rounded === 0 && percentage > 0 ? '<1%' : `${rounded}%`;
}
