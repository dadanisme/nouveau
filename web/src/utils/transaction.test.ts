import { describe, expect, it } from 'vitest';

import type { Category, DraftTransaction, TransactionWithCategory } from '@/types/transaction';
import { filterCategories } from '@/utils/category';
import {
  buildCategoryPatch,
  buildCellPatch,
  buildTransactionFromDraft,
  chunk,
  compareNewestFirst,
  computeTotals,
  filterTransactions,
  insertIntoTransactionList,
  isForeignCurrency,
  patchTransactionList,
  removeFromTransactionList,
  toInsertPayload,
} from '@/utils/transaction';

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-food',
    name: 'Food',
    type: 'expense',
    color: '#EF4444',
    icon: 'Ionicons/fast-food',
    is_default: false,
    created_at: null,
    updated_at: null,
    user_id: 'user-1',
    workspace_id: 'ws-1',
    ...overrides,
  };
}

const food = category();
const salary = category({ id: 'cat-salary', name: 'Salary', type: 'income', color: '#16A34A' });
const transport = category({ id: 'cat-transport', name: 'Transport' });

function tx(overrides: Partial<TransactionWithCategory> = {}): TransactionWithCategory {
  return {
    id: 'tx-1',
    amount: 15000,
    home_amount: 15000,
    currency: 'IDR',
    home_currency: 'IDR',
    category_id: food.id,
    date: '2026-10-05',
    description: 'Lunch',
    type: 'expense',
    user_id: 'user-1',
    workspace_id: 'ws-1',
    created_at: '2026-10-05T05:00:00+00:00',
    updated_at: '2026-10-05T05:00:00+00:00',
    category: food,
    ...overrides,
  };
}

const october = { from: '2026-10-01', to: '2026-10-31' };

describe('computeTotals', () => {
  it('sums income and expense in the home currency', () => {
    const totals = computeTotals([
      tx({ home_amount: 15000 }),
      tx({ id: 'tx-2', home_amount: 5000 }),
      tx({ id: 'tx-3', type: 'income', home_amount: 100000 }),
      // Foreign currency: `amount` is in USD, `home_amount` is what counts.
      tx({ id: 'tx-4', amount: 10, currency: 'USD', home_amount: 160000 }),
    ]);
    expect(totals).toEqual({ income: 100000, expense: 180000 });
  });

  it('is zero for no data', () => {
    expect(computeTotals(undefined)).toEqual({ income: 0, expense: 0 });
    expect(computeTotals([])).toEqual({ income: 0, expense: 0 });
  });
});

describe('filterTransactions', () => {
  const rows = [
    tx({ id: 'a', description: 'Lunch at Warung' }),
    tx({ id: 'b', description: null, category_id: transport.id, category: transport }),
    tx({ id: 'c', description: 'October salary', type: 'income', category_id: salary.id }),
  ];
  const none = { search: '', type: 'all', categoryId: null } as const;

  it('returns the same array when nothing is filtered', () => {
    expect(filterTransactions(rows, none)).toBe(rows);
  });

  it('searches the description, case-insensitively', () => {
    expect(filterTransactions(rows, { ...none, search: '  WARUNG ' }).map((r) => r.id)).toEqual([
      'a',
    ]);
    expect(filterTransactions(rows, { ...none, search: 'zzz' })).toEqual([]);
  });

  it('filters by type and category, combined with search', () => {
    expect(filterTransactions(rows, { ...none, type: 'income' }).map((r) => r.id)).toEqual(['c']);
    expect(
      filterTransactions(rows, { ...none, categoryId: transport.id }).map((r) => r.id),
    ).toEqual(['b']);
    expect(filterTransactions(rows, { search: 'lunch', type: 'income', categoryId: null })).toEqual(
      [],
    );
  });
});

describe('buildCellPatch', () => {
  it('returns null when the value did not change', () => {
    expect(buildCellPatch(tx(), { field: 'date', value: '2026-10-05' })).toBeNull();
    expect(buildCellPatch(tx(), { field: 'description', value: ' Lunch ' })).toBeNull();
    expect(buildCellPatch(tx(), { field: 'category', value: food })).toBeNull();
    expect(buildCellPatch(tx(), { field: 'amount', value: 15000 })).toBeNull();
    expect(
      buildCellPatch(tx({ description: null }), { field: 'description', value: '  ' }),
    ).toBeNull();
  });

  it('patches date and description', () => {
    expect(buildCellPatch(tx(), { field: 'date', value: '2026-10-06' })).toEqual({
      patch: { date: '2026-10-06' },
    });
    expect(buildCellPatch(tx(), { field: 'description', value: ' Dinner ' })).toEqual({
      patch: { description: 'Dinner' },
    });
    expect(buildCellPatch(tx(), { field: 'description', value: '' })).toEqual({
      patch: { description: null },
    });
  });

  it('moves the transaction to the type of the new category', () => {
    expect(buildCellPatch(tx(), { field: 'category', value: salary })).toEqual({
      patch: { category_id: salary.id, type: 'income' },
      category: salary,
    });
  });

  it('keeps home_amount equal to amount for home-currency transactions', () => {
    expect(buildCellPatch(tx(), { field: 'amount', value: 20000 })).toEqual({
      patch: { amount: 20000, home_amount: 20000 },
    });
  });

  it('refuses amount edits on foreign-currency transactions and non-positive amounts', () => {
    const foreign = tx({ amount: 10, currency: 'USD', home_amount: 160000 });
    expect(isForeignCurrency(foreign)).toBe(true);
    expect(isForeignCurrency(tx())).toBe(false);
    expect(buildCellPatch(foreign, { field: 'amount', value: 12 })).toBeNull();
    expect(buildCellPatch(tx(), { field: 'amount', value: 0 })).toBeNull();
    expect(buildCellPatch(tx(), { field: 'amount', value: Number.NaN })).toBeNull();
  });
});

describe('buildCategoryPatch', () => {
  it('sets the category and its type', () => {
    expect(buildCategoryPatch(salary)).toEqual({ category_id: salary.id, type: 'income' });
  });
});

describe('buildTransactionFromDraft', () => {
  const context = {
    id: 'new-id',
    userId: 'user-1',
    workspaceId: 'ws-1',
    homeCurrency: 'IDR',
    categories: [food, salary],
    now: new Date(2026, 9, 1),
  };
  const draft: DraftTransaction = {
    dateText: '2026-10-03',
    description: '  Coffee ',
    categoryId: food.id,
    amountText: '25.000',
    type: 'expense',
  };

  it('builds a home-currency row with the fields mobile inserts', () => {
    const result = buildTransactionFromDraft(draft, context);
    expect(result).toEqual({
      ok: true,
      transaction: {
        id: 'new-id',
        amount: 25000,
        home_amount: 25000,
        currency: 'IDR',
        home_currency: 'IDR',
        category_id: food.id,
        date: '2026-10-03',
        description: 'Coffee',
        type: 'expense',
        user_id: 'user-1',
        workspace_id: 'ws-1',
        created_at: null,
        updated_at: null,
        category: {
          id: food.id,
          name: 'Food',
          type: 'expense',
          color: '#EF4444',
          icon: 'Ionicons/fast-food',
        },
      },
    });
  });

  it('stores an empty description as null and resolves shorthand dates', () => {
    const result = buildTransactionFromDraft(
      { ...draft, description: ' ', dateText: '7' },
      context,
    );
    expect(result.ok && result.transaction.description).toBeNull();
    expect(result.ok && result.transaction.date).toBe('2026-10-07');
  });

  it('reports every invalid field, in tab order', () => {
    expect(
      buildTransactionFromDraft(
        { ...draft, dateText: '31/2', categoryId: null, amountText: '0' },
        context,
      ),
    ).toEqual({ ok: false, invalid: ['date', 'category', 'amount'] });
    expect(buildTransactionFromDraft({ ...draft, categoryId: 'gone' }, context)).toEqual({
      ok: false,
      invalid: ['category'],
    });
    expect(buildTransactionFromDraft({ ...draft, amountText: '12.5' }, context)).toEqual({
      ok: false,
      invalid: ['amount'],
    });
  });
});

describe('toInsertPayload', () => {
  it('drops the joined category and keeps ids and timestamps for a restore', () => {
    const payload = toInsertPayload(tx());
    expect(payload).not.toHaveProperty('category');
    expect(payload.id).toBe('tx-1');
    expect(payload.created_at).toBe('2026-10-05T05:00:00+00:00');
  });

  it('omits empty timestamps so database defaults apply to new rows', () => {
    const payload = toInsertPayload(tx({ created_at: null, updated_at: null }));
    expect(payload).not.toHaveProperty('created_at');
    expect(payload).not.toHaveProperty('updated_at');
  });
});

describe('optimistic list updates', () => {
  const list = [
    tx({ id: 'a', date: '2026-10-20' }),
    tx({ id: 'b', date: '2026-10-10' }),
    tx({ id: 'c', date: '2026-10-01' }),
  ];

  it('patches matching rows and swaps in the joined category', () => {
    const patched = patchTransactionList(
      list,
      new Set(['a', 'c']),
      { category_id: salary.id, type: 'income' },
      salary,
      october,
    );
    expect(patched.map((row) => row.category.name)).toEqual(['Salary', 'Food', 'Salary']);
    expect(patched.map((row) => row.type)).toEqual(['income', 'expense', 'income']);
    expect(list[0].category.name).toBe('Food');
  });

  it('drops a row whose date moves out of the range', () => {
    const patched = patchTransactionList(
      list,
      new Set(['b']),
      { date: '2026-11-02' },
      undefined,
      october,
    );
    expect(patched.map((row) => row.id)).toEqual(['a', 'c']);
  });

  it('removes rows', () => {
    expect(removeFromTransactionList(list, new Set(['a', 'c'])).map((row) => row.id)).toEqual([
      'b',
    ]);
  });

  it('inserts rows of the same workspace and range, newest first, without duplicates', () => {
    const inserted = insertIntoTransactionList(
      list,
      [
        tx({ id: 'new', date: '2026-10-10', created_at: null }),
        tx({ id: 'other-ws', workspace_id: 'ws-2' }),
        tx({ id: 'other-month', date: '2026-11-01' }),
        tx({ id: 'a', date: '2026-10-20' }),
      ],
      'ws-1',
      october,
    );
    expect(inserted.map((row) => row.id)).toEqual(['a', 'new', 'b', 'c']);
  });

  it('puts a new unsaved row above an earlier unsaved row of the same date', () => {
    const first = insertIntoTransactionList(
      [],
      [tx({ id: 'first', date: '2026-10-10', created_at: null })],
      'ws-1',
      october,
    );
    const second = insertIntoTransactionList(
      first,
      [tx({ id: 'second', date: '2026-10-10', created_at: null })],
      'ws-1',
      october,
    );
    expect(second.map((row) => row.id)).toEqual(['second', 'first']);
  });

  it('returns the same list when nothing is added', () => {
    expect(
      insertIntoTransactionList(list, [tx({ id: 'x', date: '2027-01-01' })], 'ws-1', october),
    ).toBe(list);
  });
});

describe('compareNewestFirst', () => {
  it('orders by date, then creation time, with unsaved rows first', () => {
    const older = tx({ id: 'older', created_at: '2026-10-05T01:00:00+00:00' });
    const newer = tx({ id: 'newer', created_at: '2026-10-05T09:00:00+00:00' });
    const unsaved = tx({ id: 'unsaved', created_at: null });
    const nextDay = tx({ id: 'next-day', date: '2026-10-06', created_at: '2026-10-01T00:00:00' });
    expect([older, unsaved, nextDay, newer].sort(compareNewestFirst).map((row) => row.id)).toEqual([
      'next-day',
      'unsaved',
      'newer',
      'older',
    ]);
  });
});

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe('filterCategories', () => {
  const categories = [salary, transport, food];

  it('lists the preferred type first, alphabetically within a type', () => {
    expect(filterCategories(categories, '').map((item) => item.name)).toEqual([
      'Food',
      'Transport',
      'Salary',
    ]);
    expect(filterCategories(categories, '', 'income').map((item) => item.name)).toEqual([
      'Salary',
      'Food',
      'Transport',
    ]);
  });

  it('matches part of the name, case-insensitively', () => {
    expect(filterCategories(categories, ' SPORT').map((item) => item.name)).toEqual(['Transport']);
    expect(filterCategories(categories, 'xyz')).toEqual([]);
  });
});
