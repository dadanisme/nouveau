import { colors } from '@/constants/colors';
import type { TransactionWithCategory } from '@/hooks/use-transactions';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

export interface CategorySpend {
  /** Absent for the synthetic "Others" bucket */
  id?: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface MonthlyPoint {
  month: number;
  income: number;
  expense: number;
}

export function computeTotals(transactions: TransactionWithCategory[] | undefined): {
  income: number;
  expense: number;
} {
  if (!transactions) return { income: 0, expense: 0 };
  return transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.home_amount;
      else acc.expense += tx.home_amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

export function computeExpenseBreakdown(
  transactions: TransactionWithCategory[] | undefined,
  maxCategories = Infinity,
): CategorySpend[] {
  if (!transactions) return [];
  const expenseTotal = transactions.reduce(
    (sum, tx) => (tx.type === 'expense' ? sum + tx.home_amount : sum),
    0,
  );
  if (expenseTotal === 0) return [];

  // Aggregate by category
  const categoryMap: Record<string, { id: string; name: string; color: string; amount: number }> =
    {};
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const catId = tx.category.id;
    if (!categoryMap[catId]) {
      categoryMap[catId] = {
        id: catId,
        name: tx.category.name,
        color: tx.category.color,
        amount: 0,
      };
    }
    categoryMap[catId].amount += tx.home_amount;
  }

  // Sort by amount descending
  const sorted = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

  if (sorted.length <= maxCategories) {
    return sorted.map((cat) => ({
      ...cat,
      percentage: (cat.amount / expenseTotal) * 100,
    }));
  }

  // Top N + Others
  const top = sorted.slice(0, maxCategories);
  const othersAmount = sorted.slice(maxCategories).reduce((sum, cat) => sum + cat.amount, 0);
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
}

export function computeMonthlyTrend(
  transactions: TransactionWithCategory[] | undefined,
): MonthlyPoint[] {
  const points: MonthlyPoint[] = Array.from({ length: 12 }, (_, month) => ({
    month,
    income: 0,
    expense: 0,
  }));
  if (!transactions) return points;

  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0];
    const month = new Date(dateKey + 'T00:00:00').getMonth();
    if (tx.type === 'income') points[month].income += tx.home_amount;
    else points[month].expense += tx.home_amount;
  }
  return points;
}
