import type { Row } from '@tanstack/react-table';
import { Trash2Icon } from 'lucide-react';

import { CategoryLabel } from '@/components/transactions/category-label';
import {
  CategoryCellEditor,
  DateCellEditor,
  TextCellEditor,
} from '@/components/transactions/cell-editors';
import { CELL_CLASS } from '@/components/transactions/table-styles';
import { Checkbox } from '@/components/ui/checkbox';
import type { TransactionsTableFeatures } from '@/lib/transactions-table';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type {
  Category,
  EditableField,
  TransactionType,
  TransactionWithCategory,
} from '@/types/transaction';
import {
  currencyDecimals,
  formatForeignAmount,
  formatSignedAmount,
  toAmountInput,
} from '@/utils/currency';
import { formatDate, toDateKey } from '@/utils/date';
import { interpolate } from '@/utils/string';
import { isForeignCurrency } from '@/utils/transaction';

const t = en.transactions;

const EDITING_CLASS = 'bg-card shadow-[inset_0_0_0_2px_var(--ring)]';

export interface TransactionRowHandlers {
  onStartEdit: (rowId: string, field: EditableField) => void;
  onStopEdit: () => void;
  onEditDate: (transaction: TransactionWithCategory, text: string) => void;
  onEditDescription: (transaction: TransactionWithCategory, text: string) => void;
  onEditCategory: (transaction: TransactionWithCategory, category: Category) => void;
  onEditAmount: (transaction: TransactionWithCategory, text: string) => void;
  onDelete: (transaction: TransactionWithCategory) => void;
}

interface TransactionRowProps extends TransactionRowHandlers {
  row: Row<TransactionsTableFeatures, TransactionWithCategory>;
  isSelected: boolean;
  /** The cell of this row being edited, if any. */
  editingField: EditableField | null;
  categories: Category[];
}

interface CellButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

/** A cell in display mode: click (or Enter when focused) to edit. */
function CellButton({ onClick, className, children }: CellButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 w-full cursor-text items-center px-2 text-left outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TypeLabel({ type }: { type: TransactionType | string }) {
  const isIncome = type === 'income';
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', isIncome ? 'bg-income' : 'bg-expense')}
      />
      {isIncome ? t.income : t.expense}
    </span>
  );
}

export function TransactionRow({
  row,
  isSelected,
  editingField,
  categories,
  onStartEdit,
  onStopEdit,
  onEditDate,
  onEditDescription,
  onEditCategory,
  onEditAmount,
  onDelete,
}: TransactionRowProps) {
  const transaction = row.original;
  const isIncome = transaction.type === 'income';
  const isForeign = isForeignCurrency(transaction);
  const startEdit = (field: EditableField) => () => onStartEdit(row.id, field);

  return (
    <tr
      data-selected={isSelected || undefined}
      className="group hover:bg-muted data-selected:bg-primary-soft/60"
    >
      <td className={cn(CELL_CLASS, 'text-center')}>
        <Checkbox
          aria-label={t.selectRow}
          checked={isSelected}
          className="mx-auto select-none"
          // Shift-click would otherwise select the text between the two rows.
          onMouseDown={(event) => {
            if (event.shiftKey) event.preventDefault();
          }}
          // TanStack's handler reads `target.checked` and the shift key to select ranges.
          onClick={(event) =>
            row.getToggleSelectedHandler()({
              target: { checked: !isSelected },
              shiftKey: event.shiftKey,
            })
          }
        />
      </td>

      <td className={cn(CELL_CLASS, 'border-l', editingField === 'date' && EDITING_CLASS)}>
        {editingField === 'date' ? (
          <DateCellEditor
            initialValue={toDateKey(transaction.date)}
            onCommit={(text) => {
              onEditDate(transaction, text);
              onStopEdit();
            }}
            onCancel={onStopEdit}
          />
        ) : (
          <CellButton onClick={startEdit('date')} className="tabular-nums">
            {formatDate(transaction.date)}
          </CellButton>
        )}
      </td>

      <td className={cn(CELL_CLASS, 'border-l', editingField === 'description' && EDITING_CLASS)}>
        {editingField === 'description' ? (
          <TextCellEditor
            label={t.columns.description}
            initialValue={transaction.description ?? ''}
            onCommit={(text) => {
              onEditDescription(transaction, text);
              onStopEdit();
            }}
            onCancel={onStopEdit}
          />
        ) : (
          <CellButton onClick={startEdit('description')}>
            {transaction.description ? (
              <span className="truncate font-medium">{transaction.description}</span>
            ) : (
              <span className="truncate text-muted-foreground">{t.noDescription}</span>
            )}
          </CellButton>
        )}
      </td>

      <td className={cn(CELL_CLASS, 'border-l', editingField === 'category' && EDITING_CLASS)}>
        {editingField === 'category' ? (
          <CategoryCellEditor
            categories={categories}
            selectedId={transaction.category_id}
            preferredType={isIncome ? 'income' : 'expense'}
            onCommit={(category) => {
              onEditCategory(transaction, category);
              onStopEdit();
            }}
            onCancel={onStopEdit}
          />
        ) : (
          <CellButton onClick={startEdit('category')}>
            <CategoryLabel category={transaction.category} />
          </CellButton>
        )}
      </td>

      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <TypeLabel type={transaction.type} />
      </td>

      <td className={cn(CELL_CLASS, 'border-l', editingField === 'amount' && EDITING_CLASS)}>
        {isForeign ? (
          // Milestone 2: amounts in a foreign currency are read-only (no rate conversion yet).
          <div
            title={interpolate(t.foreignAmountHint, { currency: transaction.currency })}
            className="flex h-8 items-center justify-end gap-2 px-2 tabular-nums"
          >
            <span className="truncate text-xs text-muted-foreground">
              {formatForeignAmount(transaction.amount, transaction.currency)}
            </span>
            <span className={cn('font-medium', isIncome ? 'text-income' : 'text-expense')}>
              {formatSignedAmount(
                transaction.home_amount,
                transaction.type,
                transaction.home_currency,
              )}
            </span>
          </div>
        ) : editingField === 'amount' ? (
          <TextCellEditor
            label={t.columns.amount}
            align="right"
            inputMode="decimal"
            initialValue={toAmountInput(transaction.amount, currencyDecimals(transaction.currency))}
            onCommit={(text) => {
              onEditAmount(transaction, text);
              onStopEdit();
            }}
            onCancel={onStopEdit}
          />
        ) : (
          <CellButton
            onClick={startEdit('amount')}
            className={cn(
              'justify-end font-medium tabular-nums',
              isIncome ? 'text-income' : 'text-expense',
            )}
          >
            {formatSignedAmount(
              transaction.home_amount,
              transaction.type,
              transaction.home_currency,
            )}
          </CellButton>
        )}
      </td>

      <td className={cn(CELL_CLASS, 'text-center')}>
        <button
          type="button"
          aria-label={t.deleteRow}
          title={t.deleteRow}
          onClick={() => onDelete(transaction)}
          className="mx-auto flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 outline-none group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}
