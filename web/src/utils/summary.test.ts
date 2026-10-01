import { describe, expect, it } from 'vitest';

import type { TransactionCategory, TransactionWithCategory } from '@/types/transaction';
import {
  computeBreakdownGroups,
  computeCategoryBreakdown,
  computeSummary,
  formatPercentage,
} from '@/utils/summary';
import { filterTransactions } from '@/utils/transaction';

const food: TransactionCategory = {
  id: 'cat-food',
  name: 'Food',
  type: 'expense',
  color: '#EF4444',
  icon: 'Ionicons/fast-food',
};
const transport: TransactionCategory = {
  id: 'cat-transport',
  name: 'Transport',
  type: 'expense',
  color: '#3B82F6',
  icon: null,
};
const salary: TransactionCategory = {
  id: 'cat-salary',
  name: 'Salary',
  type: 'income',
  color: '#16A34A',
  icon: 'Ionicons/cash',
};

let nextId = 1;
function tx(
  category: TransactionCategory,
  homeAmount: number,
  overrides: Partial<TransactionWithCategory> = {},
): TransactionWithCategory {
  return {
    id: `tx-${nextId++}`,
    amount: homeAmount,
    home_amount: homeAmount,
    currency: 'IDR',
    home_currency: 'IDR',
    category_id: category.id,
    date: '2026-10-01',
    description: null,
    type: category.type,
    user_id: 'user-1',
    workspace_id: 'ws-1',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category,
    ...overrides,
  };
}

const rows = [
  tx(food, 50_000, { description: 'Lunch' }),
  tx(food, 25_000, { description: 'Coffee' }),
  tx(transport, 25_000, { description: 'Train' }),
  tx(salary, 1_000_000, { description: 'October salary' }),
  // Entered in USD: only the home amount counts.
  tx(food, 160_000, { amount: 10, currency: 'USD', description: 'Dinner abroad' }),
];

describe('computeSummary', () => {
  it('sums income, expense and net in the home currency', () => {
    expect(computeSummary(rows)).toEqual({ income: 1_000_000, expense: 260_000, net: 740_000 });
  });

  it('uses home_amount, not the original amount, for foreign rows', () => {
    const usd = tx(food, 163_500.5, { amount: 10, currency: 'USD' });
    expect(computeSummary([usd])).toEqual({ income: 0, expense: 163_500.5, net: -163_500.5 });
  });

  it('rounds to the home currency so the three figures add up', () => {
    // 15.000.000 - 410.862,5 would show as 410.863 and 14.589.138 unrounded.
    const mixed = [
      tx(salary, 15_000_000),
      tx(food, 187_500),
      tx(food, 223_362.5, { currency: 'USD' }),
    ];
    expect(computeSummary(mixed, 0)).toEqual({
      income: 15_000_000,
      expense: 410_863,
      net: 14_589_137,
    });
    expect(computeSummary([tx(food, 0.1), tx(food, 0.2)], 2).expense).toBe(0.3);
  });

  it('has a negative net when expenses exceed income', () => {
    expect(computeSummary([tx(food, 30_000), tx(salary, 10_000)]).net).toBe(-20_000);
  });

  it('is zero for no data', () => {
    expect(computeSummary(undefined)).toEqual({ income: 0, expense: 0, net: 0 });
    expect(computeSummary([])).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it('follows the rows it is given (filters applied by the caller)', () => {
    const none = { search: '', type: 'all', categoryId: null } as const;
    expect(computeSummary(filterTransactions(rows, { ...none, categoryId: food.id }))).toEqual({
      income: 0,
      expense: 235_000,
      net: -235_000,
    });
    expect(computeSummary(filterTransactions(rows, { ...none, type: 'income' }))).toEqual({
      income: 1_000_000,
      expense: 0,
      net: 1_000_000,
    });
    expect(computeSummary(filterTransactions(rows, { ...none, search: 'coffee' })).expense).toBe(
      25_000,
    );
  });
});

describe('computeCategoryBreakdown', () => {
  it('groups expenses by category, largest first, with shares of the expense total', () => {
    const breakdown = computeCategoryBreakdown(rows, 'expense');
    expect(breakdown.map((entry) => [entry.id, entry.amount])).toEqual([
      [food.id, 235_000],
      [transport.id, 25_000],
    ]);
    expect(breakdown[0].percentage).toBeCloseTo((235_000 / 260_000) * 100);
    expect(breakdown[1].percentage).toBeCloseTo((25_000 / 260_000) * 100);
    expect(breakdown[0].percentage + breakdown[1].percentage).toBeCloseTo(100);
  });

  it('scales bars to the largest category', () => {
    const breakdown = computeCategoryBreakdown(rows, 'expense');
    expect(breakdown[0].ratio).toBe(1);
    expect(breakdown[1].ratio).toBeCloseTo(25_000 / 235_000);
  });

  it('carries what a row needs to render and filter', () => {
    expect(computeCategoryBreakdown(rows, 'expense')[0]).toMatchObject({
      id: food.id,
      name: 'Food',
      color: '#EF4444',
      icon: 'Ionicons/fast-food',
    });
  });

  it('breaks down income separately', () => {
    expect(computeCategoryBreakdown(rows, 'income')).toEqual([
      { ...pick(salary), amount: 1_000_000, percentage: 100, ratio: 1 },
    ]);
  });

  it('orders equal amounts by name', () => {
    const tied = [tx(transport, 10_000), tx(food, 10_000)];
    expect(computeCategoryBreakdown(tied, 'expense').map((entry) => entry.name)).toEqual([
      'Food',
      'Transport',
    ]);
  });

  it('is empty when there is nothing of that type', () => {
    expect(computeCategoryBreakdown(undefined, 'expense')).toEqual([]);
    expect(computeCategoryBreakdown([], 'expense')).toEqual([]);
    expect(computeCategoryBreakdown([tx(salary, 5_000)], 'expense')).toEqual([]);
  });
});

describe('computeBreakdownGroups', () => {
  it('shows both types for "all", expense first, each with shares of its own total', () => {
    const groups = computeBreakdownGroups(rows, 'all');
    expect(groups.map((group) => [group.type, group.total])).toEqual([
      ['expense', 260_000],
      ['income', 1_000_000],
    ]);
    expect(groups[0].categories).toEqual(computeCategoryBreakdown(rows, 'expense'));
    expect(groups[1].categories).toEqual(computeCategoryBreakdown(rows, 'income'));
    // Income dwarfs the expenses, but each group adds up to 100% on its own.
    for (const group of groups) {
      const share = group.categories.reduce((sum, entry) => sum + entry.percentage, 0);
      expect(share).toBeCloseTo(100);
      expect(group.categories[0].ratio).toBe(1);
    }
  });

  it('shows only the filtered type', () => {
    expect(computeBreakdownGroups(rows, 'expense').map((group) => group.type)).toEqual(['expense']);
    expect(computeBreakdownGroups(rows, 'income')).toEqual([
      { type: 'income', total: 1_000_000, categories: computeCategoryBreakdown(rows, 'income') },
    ]);
  });

  it('leaves out a type with no rows instead of an empty group', () => {
    const onlyIncome = [tx(salary, 5_000)];
    expect(computeBreakdownGroups(onlyIncome, 'all').map((group) => group.type)).toEqual([
      'income',
    ]);
    expect(computeBreakdownGroups(onlyIncome, 'expense')).toEqual([]);
  });

  it('is empty when there is nothing to break down', () => {
    expect(computeBreakdownGroups(undefined, 'all')).toEqual([]);
    expect(computeBreakdownGroups([], 'all')).toEqual([]);
  });
});

describe('formatPercentage', () => {
  it('rounds to a whole percent', () => {
    expect(formatPercentage(90.38)).toBe('90%');
    expect(formatPercentage(9.62)).toBe('10%');
    expect(formatPercentage(100)).toBe('100%');
  });

  it('does not show a real share as 0%', () => {
    expect(formatPercentage(0.2)).toBe('<1%');
    expect(formatPercentage(0)).toBe('0%');
  });
});

function pick({ id, name, color, icon }: TransactionCategory) {
  return { id, name, color, icon };
}
