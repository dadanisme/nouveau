import type { TablesInsert, TablesUpdate } from '@/types/supabase';
import type {
  Category,
  CellEdit,
  DateRange,
  DraftField,
  DraftTransaction,
  TransactionCategory,
  TransactionFilters,
  TransactionType,
  TransactionWithCategory,
} from '@/types/transaction';
import { currencyDecimals, parseAmountInput } from '@/utils/currency';
import { isDateInRange, parseDateInput, toDateKey } from '@/utils/date';

/** Income and expense sums in the home currency (same as mobile's `computeTotals`). */
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

/** True when the transaction was entered in a currency other than the workspace's. */
export function isForeignCurrency(
  tx: Pick<TransactionWithCategory, 'currency' | 'home_currency'>,
): boolean {
  return tx.currency !== tx.home_currency;
}

function toTransactionType(type: string): TransactionType | null {
  return type === 'income' || type === 'expense' ? type : null;
}

export function filterTransactions(
  transactions: TransactionWithCategory[],
  { search, type, categoryId }: TransactionFilters,
): TransactionWithCategory[] {
  const needle = search.trim().toLowerCase();
  if (!needle && type === 'all' && !categoryId) return transactions;
  return transactions.filter(
    (tx) =>
      (type === 'all' || tx.type === type) &&
      (!categoryId || tx.category_id === categoryId) &&
      (!needle || (tx.description ?? '').toLowerCase().includes(needle)),
  );
}

/** Newest first: by date, then by creation time, the order the list query uses. */
export function compareNewestFirst(a: TransactionWithCategory, b: TransactionWithCategory): number {
  const byDate = toDateKey(b.date).localeCompare(toDateKey(a.date));
  if (byDate !== 0) return byDate;
  return createdAtKey(b).localeCompare(createdAtKey(a));
}

/** Rows not saved yet have no `created_at`; they count as the newest. */
function createdAtKey(tx: TransactionWithCategory): string {
  return tx.created_at ?? '\uffff';
}

/**
 * Turns one inline cell edit into the columns to update, or null when nothing changes.
 *
 * - Picking a category also moves the transaction to that category's type, because mobile
 *   only ever offers categories of the transaction's type.
 * - An amount edit keeps `home_amount` equal to `amount`. That is only correct when the
 *   transaction is in the home currency, so foreign-currency amounts are not editable here.
 */
export function buildCellPatch(
  tx: TransactionWithCategory,
  edit: CellEdit,
): { patch: TablesUpdate<'transactions'>; category?: TransactionCategory } | null {
  switch (edit.field) {
    case 'date':
      return edit.value === toDateKey(tx.date) ? null : { patch: { date: edit.value } };
    case 'description': {
      const description = edit.value.trim() || null;
      return description === (tx.description ?? null) ? null : { patch: { description } };
    }
    case 'category': {
      if (edit.value.id === tx.category_id) return null;
      const type = toTransactionType(edit.value.type);
      return {
        patch: { category_id: edit.value.id, ...(type ? { type } : {}) },
        category: edit.value,
      };
    }
    case 'amount':
      if (isForeignCurrency(tx) || !(edit.value > 0) || edit.value === tx.amount) return null;
      return { patch: { amount: edit.value, home_amount: edit.value } };
  }
}

/** The patch for moving any number of transactions to one category. */
export function buildCategoryPatch(category: TransactionCategory): TablesUpdate<'transactions'> {
  const type = toTransactionType(category.type);
  return { category_id: category.id, ...(type ? { type } : {}) };
}

export function emptyDraft(dateKey: string): DraftTransaction {
  return { dateText: dateKey, description: '', categoryId: null, amountText: '', type: 'expense' };
}

export interface NewTransactionContext {
  id: string;
  userId: string;
  workspaceId: string;
  homeCurrency: string;
  categories: Category[];
  now: Date;
}

export type DraftResult =
  { ok: true; transaction: TransactionWithCategory } | { ok: false; invalid: DraftField[] };

/**
 * Validates the quick-add row and builds the row to insert. Required fields and values match
 * mobile's add form: a positive amount and a category are required; new transactions are in
 * the workspace's home currency, so `home_amount` equals `amount`.
 */
export function buildTransactionFromDraft(
  draft: DraftTransaction,
  { id, userId, workspaceId, homeCurrency, categories, now }: NewTransactionContext,
): DraftResult {
  const date = parseDateInput(draft.dateText, now);
  const amount = parseAmountInput(draft.amountText, currencyDecimals(homeCurrency));
  const category = categories.find((item) => item.id === draft.categoryId);

  const invalid: DraftField[] = [];
  if (!date) invalid.push('date');
  if (!category) invalid.push('category');
  if (amount === null) invalid.push('amount');
  if (!date || !category || amount === null) return { ok: false, invalid };

  return {
    ok: true,
    transaction: {
      id,
      amount,
      home_amount: amount,
      currency: homeCurrency,
      home_currency: homeCurrency,
      category_id: category.id,
      date,
      description: draft.description.trim() || null,
      type: draft.type,
      user_id: userId,
      workspace_id: workspaceId,
      // Left for the database defaults; see `toInsertPayload`.
      created_at: null,
      updated_at: null,
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      },
    },
  };
}

/**
 * The row as it is sent to the `transactions` table: without the joined category, and without
 * empty timestamps so the database defaults apply to new rows. Restoring a deleted row keeps
 * its original id and timestamps.
 */
export function toInsertPayload({
  category: _category,
  created_at,
  updated_at,
  ...row
}: TransactionWithCategory): TablesInsert<'transactions'> {
  return {
    ...row,
    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

/* Optimistic cache updates. Each works on one cached list and the date range it covers. */

export function patchTransactionList(
  list: TransactionWithCategory[],
  ids: ReadonlySet<string>,
  patch: TablesUpdate<'transactions'>,
  category: TransactionCategory | undefined,
  range: DateRange,
): TransactionWithCategory[] {
  const patched = list.map((tx) =>
    ids.has(tx.id) ? { ...tx, ...patch, category: category ?? tx.category } : tx,
  );
  // A date edit can move a row out of the list's range.
  return patch.date ? patched.filter((tx) => isDateInRange(tx.date, range)) : patched;
}

export function removeFromTransactionList(
  list: TransactionWithCategory[],
  ids: ReadonlySet<string>,
): TransactionWithCategory[] {
  return list.filter((tx) => !ids.has(tx.id));
}

export function insertIntoTransactionList(
  list: TransactionWithCategory[],
  rows: TransactionWithCategory[],
  workspaceId: string,
  range: DateRange,
): TransactionWithCategory[] {
  const existing = new Set(list.map((tx) => tx.id));
  const additions = rows.filter(
    (tx) =>
      tx.workspace_id === workspaceId && isDateInRange(tx.date, range) && !existing.has(tx.id),
  );
  if (additions.length === 0) return list;
  // Additions go first: the sort is stable, so rows that tie (two unsaved rows on the same
  // date) keep the newest on top, as the server will order them.
  return [...additions, ...list].sort(compareNewestFirst);
}

/** Splits ids into batches so `id=in.(...)` filters stay well under URL length limits. */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
