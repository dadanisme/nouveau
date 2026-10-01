import {
  createColumnHelper,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';

import { en } from '@/locales/en';
import type { TransactionWithCategory } from '@/types/transaction';
import { toDateKey } from '@/utils/date';
import { compareNewestFirst } from '@/utils/transaction';

/** Only the features the transactions table uses (TanStack Table v9 registers them explicitly). */
export const transactionsTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowSelectionFeature,
});

export type TransactionsTableFeatures = typeof transactionsTableFeatures;

const helper = createColumnHelper<TransactionsTableFeatures, TransactionWithCategory>();

const labels = en.transactions.columns;

/**
 * Column model only: ids, headers and sorting. Cells are rendered by `TransactionRow`, which
 * needs editing state the column definitions do not have.
 */
export const transactionsTableColumns = helper.columns([
  helper.display({ id: 'select', enableSorting: false }),
  helper.accessor((row) => toDateKey(row.date), {
    id: 'date',
    header: labels.date,
    sortDescFirst: true,
    // Ascending comparison; ties fall back to creation time so the order is stable.
    sortFn: (a, b) => compareNewestFirst(b.original, a.original),
  }),
  helper.accessor('description', {
    id: 'description',
    header: labels.description,
    enableSorting: false,
  }),
  helper.accessor((row) => row.category.name, {
    id: 'category',
    header: labels.category,
    enableSorting: false,
  }),
  helper.accessor('type', { id: 'type', header: labels.type, enableSorting: false }),
  helper.accessor('home_amount', {
    id: 'amount',
    header: labels.amount,
    sortDescFirst: true,
    sortFn: (a, b) => a.original.home_amount - b.original.home_amount,
  }),
  helper.display({ id: 'actions', enableSorting: false }),
]);

export type TransactionColumnId =
  'select' | 'date' | 'description' | 'category' | 'type' | 'amount' | 'actions';
