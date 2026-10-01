import type { Tables } from '@/types/supabase';

export type Category = Tables<'categories'>;

export type TransactionType = 'income' | 'expense';

/** The category fields joined onto every transaction row (same join as mobile). */
export type TransactionCategory = Pick<Category, 'id' | 'name' | 'type' | 'color' | 'icon'>;

export type TransactionWithCategory = Tables<'transactions'> & {
  category: TransactionCategory;
};

/** Inclusive range of local `YYYY-MM-DD` dates. */
export interface DateRange {
  from: string;
  to: string;
}

/** `month` is zero-based, as in `Date`. */
export interface YearMonth {
  year: number;
  month: number;
}

export type TypeFilter = 'all' | TransactionType;

export interface TransactionFilters {
  search: string;
  type: TypeFilter;
  categoryId: string | null;
}

/** A single inline edit to one cell of an existing transaction. */
export type CellEdit =
  | { field: 'date'; value: string }
  | { field: 'description'; value: string }
  | { field: 'category'; value: TransactionCategory }
  | { field: 'amount'; value: number };

export type EditableField = CellEdit['field'];

/** What the quick-add row holds while it is being typed. */
export interface DraftTransaction {
  dateText: string;
  description: string;
  categoryId: string | null;
  amountText: string;
  type: TransactionType;
}

export type DraftField = 'date' | 'description' | 'category' | 'amount';
