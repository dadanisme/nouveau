import type { TransactionRowData } from '@/components/transaction-row-types';
import type { TransactionWithCategory } from '@/hooks/use-transactions';
import { getCategoryColor } from '@/utils/category-color';
import { getCategorySymbol } from '@/utils/category-icon';
import { formatCompactAmount, formatForeignAmount } from '@/utils/currency';
import { formatShortDate } from '@/utils/date';

/** A signed compact amount: "+Rp50K" for income, "−Rp12K" for an expense. */
export function formatSignedTransactionAmount(
  amount: number,
  isIncome: boolean,
  locale?: string,
): string {
  return `${isIncome ? '+' : '\u2212'}${formatCompactAmount(amount, locale)}`;
}
/**
 * Display data for a transaction row.
 * @param options.showDate Append the date to the category line (lists not grouped by day).
 * @param options.locale Pins the compact amount's suffixes (see `formatCompactAmount`).
 */
export function toTransactionRowData(
  tx: TransactionWithCategory,
  { showDate = false, locale }: { showDate?: boolean; locale?: string } = {},
): TransactionRowData {
  const isIncome = tx.type === 'income';
  const symbol = getCategorySymbol(tx.category.icon);
  const isForeign = tx.currency !== tx.home_currency;
  const dateKey = tx.date.split('T')[0];

  return {
    id: tx.id,
    title: tx.description || tx.category.name,
    subtitle: showDate ? `${tx.category.name} · ${formatShortDate(dateKey)}` : tx.category.name,
    symbol: {
      sf: symbol.sf,
      material: symbol.material,
      color: getCategoryColor(tx.category.color),
    },
    amount: formatSignedTransactionAmount(tx.home_amount, isIncome, locale),
    isIncome,
    originalAmount: isForeign ? formatForeignAmount(tx.amount, tx.currency) : undefined,
    hasProofs: (tx.receipt_proofs?.[0]?.count ?? 0) > 0,
  };
}

/** One day's transactions, newest day first. */
export interface TransactionDay {
  /** Local `YYYY-MM-DD`. */
  dateKey: string;
  income: number;
  expense: number;
  transactions: TransactionWithCategory[];
}

/** Groups transactions by their local date, days newest first, rows in their given order. */
export function groupTransactionsByDay(transactions: TransactionWithCategory[]): TransactionDay[] {
  const days = new Map<string, TransactionDay>();
  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0];
    let day = days.get(dateKey);
    if (!day) {
      day = { dateKey, income: 0, expense: 0, transactions: [] };
      days.set(dateKey, day);
    }
    if (tx.type === 'income') day.income += tx.home_amount;
    else day.expense += tx.home_amount;
    day.transactions.push(tx);
  }
  return [...days.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
