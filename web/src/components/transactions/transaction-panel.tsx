import { ChevronDownIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { CategoryLabel } from '@/components/transactions/category-label';
import {
  AmountCellEditor,
  CategoryCellEditor,
  DateCellEditor,
  TextCellEditor,
} from '@/components/transactions/cell-editors';
import { TransactionProofs } from '@/components/transactions/transaction-proofs';
import { CellButton, TypeLabel } from '@/components/transactions/transaction-row';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category, EditableField, TransactionWithCategory } from '@/types/transaction';
import {
  currencyDecimals,
  formatAmount,
  formatForeignAmount,
  formatRate,
  formatSignedAmount,
  toAmountInput,
} from '@/utils/currency';
import { formatDate, formatDateTime, toDateKey } from '@/utils/date';
import { currencyOptions, impliedRate } from '@/utils/exchange-rate';
import { isForeignCurrency } from '@/utils/transaction';

const t = en.panel;

const EDITING_CLASS = 'bg-card shadow-[inset_0_0_0_2px_var(--ring)]';

export interface TransactionPanelHandlers {
  onEditDate: (transaction: TransactionWithCategory, text: string) => void;
  onEditDescription: (transaction: TransactionWithCategory, text: string) => void;
  onEditCategory: (transaction: TransactionWithCategory, category: Category) => void;
  onEditAmount: (transaction: TransactionWithCategory, text: string) => void;
  onEditCurrency: (transaction: TransactionWithCategory, currency: string) => void;
  onDelete: (transaction: TransactionWithCategory) => void;
}

interface TransactionPanelProps extends TransactionPanelHandlers {
  transaction: TransactionWithCategory | null;
  isLoading: boolean;
  error: Error | null;
  categories: Category[];
  onClose: () => void;
}

interface FieldProps {
  label: string;
  /** Draws the editing ring around the value. */
  isEditing?: boolean;
  /** Read-only values get the same inset as editable ones. */
  readOnly?: boolean;
  children: React.ReactNode;
}

function Field({ label, isEditing, readOnly, children }: FieldProps) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <dt className="w-28 shrink-0 pl-2 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 flex-1 rounded-md',
          readOnly ? 'px-2' : 'hover:bg-muted',
          isEditing && EDITING_CLASS,
        )}
      >
        {children}
      </dd>
    </div>
  );
}

interface PanelBodyProps extends TransactionPanelHandlers {
  transaction: TransactionWithCategory;
  categories: Category[];
}

function PanelBody({
  transaction,
  categories,
  onEditDate,
  onEditDescription,
  onEditCategory,
  onEditAmount,
  onEditCurrency,
}: PanelBodyProps) {
  // Same click-to-edit cells as the table, saved through the same actions.
  const [editing, setEditing] = useState<EditableField | null>(null);
  const stopEditing = () => setEditing(null);

  const isIncome = transaction.type === 'income';
  const isForeign = isForeignCurrency(transaction);
  const rate = isForeign ? impliedRate(transaction) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className={cn('rounded-md hover:bg-muted', editing === 'description' && EDITING_CLASS)}>
        {editing === 'description' ? (
          <TextCellEditor
            label={en.transactions.columns.description}
            initialValue={transaction.description ?? ''}
            onCommit={(text) => {
              onEditDescription(transaction, text);
              stopEditing();
            }}
            onCancel={stopEditing}
          />
        ) : (
          <CellButton onClick={() => setEditing('description')} className="rounded-md">
            {transaction.description ? (
              <span className="truncate text-base font-semibold">{transaction.description}</span>
            ) : (
              <span className="truncate text-base text-muted-foreground">{t.addDescription}</span>
            )}
          </CellButton>
        )}
      </div>

      <dl className="flex flex-col gap-0.5">
        <Field label={t.fields.date} isEditing={editing === 'date'}>
          {editing === 'date' ? (
            <DateCellEditor
              initialValue={toDateKey(transaction.date)}
              onCommit={(text) => {
                onEditDate(transaction, text);
                stopEditing();
              }}
              onCancel={stopEditing}
            />
          ) : (
            <CellButton onClick={() => setEditing('date')} className="rounded-md tabular-nums">
              {formatDate(transaction.date)}
            </CellButton>
          )}
        </Field>

        <Field label={t.fields.category} isEditing={editing === 'category'}>
          {editing === 'category' ? (
            <CategoryCellEditor
              categories={categories}
              selectedId={transaction.category_id}
              preferredType={isIncome ? 'income' : 'expense'}
              onCommit={(category) => {
                onEditCategory(transaction, category);
                stopEditing();
              }}
              onCancel={stopEditing}
            />
          ) : (
            <CellButton onClick={() => setEditing('category')} className="rounded-md">
              <CategoryLabel category={transaction.category} />
            </CellButton>
          )}
        </Field>

        <Field label={t.fields.type} readOnly>
          <span className="flex items-center gap-2" title={t.typeHint}>
            <TypeLabel type={transaction.type} />
            <span className="text-xs text-muted-foreground">· {t.typeHint}</span>
          </span>
        </Field>

        <Field label={t.fields.amount} isEditing={editing === 'amount'}>
          {editing === 'amount' ? (
            <AmountCellEditor
              label={en.transactions.columns.amount}
              currency={transaction.currency}
              homeCurrency={transaction.home_currency}
              initialValue={toAmountInput(
                transaction.amount,
                currencyDecimals(transaction.currency),
              )}
              onCommit={(text) => {
                onEditAmount(transaction, text);
                stopEditing();
              }}
              onCancel={stopEditing}
            />
          ) : (
            <CellButton
              onClick={() => setEditing('amount')}
              className={cn(
                'rounded-md font-medium tabular-nums',
                isIncome ? 'text-income' : 'text-expense',
              )}
            >
              {isForeign
                ? `${isIncome ? '+' : '-'}${formatForeignAmount(transaction.amount, transaction.currency)}`
                : formatSignedAmount(transaction.amount, transaction.type, transaction.currency)}
            </CellButton>
          )}
        </Field>

        <Field label={t.fields.currency}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t.fields.currency}
                className="flex h-8 w-full items-center gap-1 rounded-md px-2 text-left outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]"
              >
                {transaction.currency}
                {!isForeign && (
                  <span className="text-xs text-muted-foreground">· {t.homeCurrencyTag}</span>
                )}
                <ChevronDownIcon className="ml-auto size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              <DropdownMenuRadioGroup
                value={transaction.currency}
                onValueChange={(currency) => onEditCurrency(transaction, currency)}
              >
                {currencyOptions(transaction.currency).map((code) => (
                  <DropdownMenuRadioItem key={code} value={code}>
                    {code}
                    {code === transaction.home_currency && (
                      <span className="text-xs text-muted-foreground">{t.homeCurrencyTag}</span>
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Field>

        {isForeign && (
          <Field label={t.fields.homeAmount} readOnly>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="font-medium">
                {formatAmount(transaction.home_amount, transaction.home_currency)}
              </span>
              {rate !== null && (
                <span className="truncate text-xs text-muted-foreground">
                  {formatRate(rate, transaction.currency, transaction.home_currency)}
                </span>
              )}
            </span>
          </Field>
        )}

        <Field label={t.fields.created} readOnly>
          <span className="text-muted-foreground tabular-nums">
            {transaction.created_at ? formatDateTime(transaction.created_at) : t.notSavedYet}
          </span>
        </Field>
        <Field label={t.fields.updated} readOnly>
          <span className="text-muted-foreground tabular-nums">
            {transaction.updated_at ? formatDateTime(transaction.updated_at) : t.notSavedYet}
          </span>
        </Field>
      </dl>

      <TransactionProofs transactionId={transaction.id} />
    </div>
  );
}

/** Right-hand panel with the full record of one transaction (Notion's side peek). */
export function TransactionPanel({
  transaction,
  isLoading,
  error,
  categories,
  onClose,
  onDelete,
  ...handlers
}: TransactionPanelProps) {
  return (
    <aside
      aria-label={t.label}
      className="flex w-page-aside shrink-0 animate-in flex-col border-l bg-surface duration-200 slide-in-from-right-8 fade-in-0"
    >
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-6">
        <h2 className="flex-1 font-semibold">{t.title}</h2>
        {transaction && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.delete}
            title={t.delete}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(transaction)}
          >
            <Trash2Icon />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.close}
          title={t.close}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </header>

      {transaction ? (
        // Keyed so an edit in progress never carries over to another transaction.
        <PanelBody
          key={transaction.id}
          transaction={transaction}
          categories={categories}
          onDelete={onDelete}
          {...handlers}
        />
      ) : isLoading ? (
        <div aria-hidden className="flex flex-col gap-3 px-6 py-5">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <p className="font-medium">{error ? t.loadFailed : t.notFound}</p>
          <p className="text-muted-foreground">{error ? error.message : t.notFoundMessage}</p>
        </div>
      )}
    </aside>
  );
}
