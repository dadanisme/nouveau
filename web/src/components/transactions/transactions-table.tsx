import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

import { DraftRow } from '@/components/transactions/draft-row';
import { CELL_CLASS } from '@/components/transactions/table-styles';
import {
  TransactionRow,
  type TransactionRowHandlers,
} from '@/components/transactions/transaction-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import type { DraftRow as DraftRowState } from '@/hooks/use-draft-row';
import type { EditingCell, TransactionsTable as TableModel } from '@/hooks/use-transactions-table';
import type { TransactionColumnId } from '@/lib/transactions-table';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category } from '@/types/transaction';
import { interpolate } from '@/utils/string';

const t = en.transactions;

const COLUMN_WIDTHS: Record<TransactionColumnId, string | undefined> = {
  select: '36px',
  date: '128px',
  description: undefined,
  category: '208px',
  type: '104px',
  amount: '200px',
  actions: '40px',
};

const SKELETON_WIDTHS = ['w-3/5', 'w-2/5', 'w-4/5', 'w-1/2', 'w-2/3', 'w-1/3', 'w-3/4', 'w-1/2'];

interface TransactionsTableProps extends TransactionRowHandlers {
  table: TableModel;
  categories: Category[];
  editingCell: EditingCell | null;
  draftRow: DraftRowState;
  isLoading: boolean;
  error: Error | null;
  hasFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
}

function SkeletonRows() {
  return SKELETON_WIDTHS.map((width, index) => (
    <tr key={index} aria-hidden>
      <td className={CELL_CLASS} />
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className="h-3.5 w-20" />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className={cn('h-3.5', width)} />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className="h-3.5 w-28" />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className="h-3.5 w-14" />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className="ml-auto h-3.5 w-24" />
      </td>
      <td className={CELL_CLASS} />
    </tr>
  ));
}

function MessageRow({ columnCount, children }: { columnCount: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={columnCount} className="px-2 py-16 text-center">
        <div className="flex flex-col items-center gap-2">{children}</div>
      </td>
    </tr>
  );
}

export function TransactionsTable({
  table,
  categories,
  editingCell,
  draftRow,
  isLoading,
  error,
  hasFilters,
  onRetry,
  onClearFilters,
  ...rowHandlers
}: TransactionsTableProps) {
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const rows = table.getRowModel().rows;
  const isAllSelected = rows.length > 0 && table.getIsAllRowsSelected();
  const isSomeSelected = !isAllSelected && rows.some((row) => row.getIsSelected());

  return (
    <table className="w-full min-w-[820px] table-fixed border-separate border-spacing-0">
      <colgroup>
        {headers.map((header) => (
          <col
            key={header.id}
            style={{ width: COLUMN_WIDTHS[header.column.id as TransactionColumnId] }}
          />
        ))}
      </colgroup>

      <thead>
        <tr>
          {headers.map((header) => {
            const { column } = header;
            const label = column.columnDef.header;
            const sorted = column.getIsSorted();
            const SortIcon = sorted === 'asc' ? ArrowUpIcon : ArrowDownIcon;
            return (
              <th
                key={header.id}
                scope="col"
                aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
                className={cn(
                  'sticky top-0 z-10 h-8 border-y bg-background p-0 text-left text-xs font-medium text-muted-foreground',
                  column.id !== 'select' && column.id !== 'actions' && 'border-l',
                )}
              >
                {column.id === 'select' ? (
                  <Checkbox
                    aria-label={t.selectAll}
                    className="mx-auto"
                    disabled={rows.length === 0}
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onClick={() => table.toggleAllRowsSelected(!isAllSelected)}
                  />
                ) : typeof label !== 'string' ? null : column.getCanSort() ? (
                  <button
                    type="button"
                    title={interpolate(t.sortBy, { column: label.toLowerCase() })}
                    onClick={column.getToggleSortingHandler()}
                    className={cn(
                      'group/sort flex h-8 w-full items-center gap-1 px-2 outline-none hover:bg-muted focus-visible:bg-muted',
                      column.id === 'amount' && 'justify-end',
                      sorted && 'text-foreground',
                    )}
                  >
                    {label}
                    <SortIcon
                      className={cn('size-3', !sorted && 'opacity-0 group-hover/sort:opacity-50')}
                    />
                  </button>
                ) : (
                  <span className="flex h-8 items-center px-2">{label}</span>
                )}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {draftRow.draft && !error && (
          <DraftRow draft={draftRow.draft} state={draftRow} categories={categories} />
        )}

        {error ? (
          <MessageRow columnCount={headers.length}>
            <p className="font-medium">{t.loadFailed}</p>
            <p className="text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {t.retry}
            </Button>
          </MessageRow>
        ) : isLoading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <MessageRow columnCount={headers.length}>
            <p className="font-medium">{hasFilters ? t.emptyFiltered : t.empty}</p>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                {t.clearFilters}
              </Button>
            ) : (
              <p className="text-muted-foreground">{t.emptyHint}</p>
            )}
          </MessageRow>
        ) : (
          rows.map((row) => (
            <TransactionRow
              key={row.id}
              row={row}
              isSelected={row.getIsSelected()}
              editingField={editingCell?.rowId === row.id ? editingCell.field : null}
              categories={categories}
              {...rowHandlers}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
