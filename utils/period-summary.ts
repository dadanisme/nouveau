import type { FormSymbol } from '@/components/native-form-types';
import type { Tables } from '@/types/supabase';
import type { CategorySpend } from '@/utils/analytics';
import { getCategoryColor } from '@/utils/category-color';
import { getCategorySymbol } from '@/utils/category-icon';
import { formatCompactAmount } from '@/utils/currency';
import { formatSignedTransactionAmount } from '@/utils/transaction';

/** A period's income, expense and balance, formatted for value rows. */
export interface PeriodSummaryValues {
  income: string;
  expense: string;
  balance: string;
}

/**
 * Formats a period's totals in the home `currency`: income with `+`, expense with `-`, the
 * balance signed by its sign. `locale` pins the compact suffixes to the in-app language (pass it
 * where the result is memoized).
 */
export function formatPeriodSummary(
  totals: { income: number; expense: number },
  currency: string,
  locale?: string,
): PeriodSummaryValues {
  const balance = totals.income - totals.expense;
  return {
    income: formatSignedTransactionAmount(totals.income, true, currency, locale),
    expense: formatSignedTransactionAmount(totals.expense, false, currency, locale),
    balance: formatSignedTransactionAmount(Math.abs(balance), balance >= 0, currency, locale),
  };
}

/** A spend breakdown row: a category, or the remaining ones together ("Others"). */
export interface SpendBreakdownRow {
  key: string;
  title: string;
  symbol: FormSymbol;
  /** Compact amount, e.g. "Rp1.2M". */
  amount: string;
  /** Share of the period's spending, 0–1. */
  share: number;
  /** The share as a whole percentage, e.g. "34%". */
  shareLabel: string;
  /** Absent for the "Others" bucket, which has no drill-down. */
  categoryId?: string;
}

/** A neutral grid, not `ellipsis` (which means More, an action). */
const OTHERS_SYMBOL = { sf: 'square.grid.2x2', material: 'category' } as const;

/**
 * Turns an expense breakdown into list rows: each category's mapped symbol in its system color
 * ("Others" takes the system gray), compact amount in the home `currency` and share. `locale`
 * pins the amounts to the in-app language and `othersTitle` names the "Others" bucket in it (both
 * memoized by callers).
 */
export function toSpendBreakdownRows(
  spends: CategorySpend[],
  categories: Pick<Tables<'categories'>, 'id' | 'icon'>[],
  { currency, locale, othersTitle }: { currency: string; locale?: string; othersTitle?: string },
): SpendBreakdownRow[] {
  const iconById = new Map(categories.map((category) => [category.id, category.icon]));
  return spends.map((spend) => {
    const symbol = spend.id ? getCategorySymbol(iconById.get(spend.id)) : OTHERS_SYMBOL;
    return {
      key: spend.id ?? 'others',
      title: spend.id ? spend.name : (othersTitle ?? spend.name),
      symbol: {
        sf: symbol.sf,
        material: symbol.material,
        color: getCategoryColor(spend.color),
      },
      amount: formatCompactAmount(spend.amount, currency, locale),
      share: spend.percentage / 100,
      shareLabel: `${Math.round(spend.percentage)}%`,
      categoryId: spend.id,
    };
  });
}
