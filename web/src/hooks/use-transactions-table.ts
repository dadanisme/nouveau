import { useTable } from '@tanstack/react-table';
import { useState } from 'react';

import { transactionsTableColumns, transactionsTableFeatures } from '@/lib/transactions-table';
import type { EditableField, TransactionWithCategory } from '@/types/transaction';

export interface EditingCell {
  rowId: string;
  field: EditableField;
}

export type TransactionsTable = ReturnType<typeof useTransactionsTable>['table'];

/**
 * Table model for the transactions page: sorting, row selection (with shift-click ranges,
 * handled by TanStack Table) and which cell is being edited.
 */
export function useTransactionsTable(data: TransactionWithCategory[]) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const table = useTable({
    features: transactionsTableFeatures,
    columns: transactionsTableColumns,
    data,
    getRowId: (row) => row.id,
    initialState: { sorting: [{ id: 'date', desc: true }] },
    enableMultiSort: false,
    enableSortingRemoval: false,
  });

  // Selection is id state that can outlive rows (deleted, filtered out). Only rows that are
  // currently in the table count as selected.
  const selectedTransactions = table.getSelectedRowModel().rows.map((row) => row.original);

  return {
    table,
    selectedTransactions,
    clearSelection: () => table.resetRowSelection(true),
    editingCell,
    startEditing: (rowId: string, field: EditableField) => setEditingCell({ rowId, field }),
    stopEditing: () => setEditingCell(null),
  };
}
