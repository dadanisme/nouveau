import { ArrowLeftRightIcon, XIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { AmountInput } from '@/components/transactions/amount-input';
import { CategoryCombobox } from '@/components/transactions/category-picker';
import { DateField } from '@/components/transactions/date-field';
import { CELL_CLASS } from '@/components/transactions/table-styles';
import { TypeLabel } from '@/components/transactions/transaction-row';
import type { DraftRow as DraftRowState } from '@/hooks/use-draft-row';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category, DraftField, DraftTransaction } from '@/types/transaction';
import { interpolate } from '@/utils/string';

const t = en.transactions;

const INVALID_CLASS = 'shadow-[inset_0_0_0_2px_var(--destructive)]';
const FOCUS_CLASS = 'focus-within:shadow-[inset_0_0_0_2px_var(--ring)]';

interface DraftRowProps {
  draft: DraftTransaction;
  state: DraftRowState;
  categories: Category[];
  /** New rows are in the workspace's home currency. */
  homeCurrency: string;
  /** Changes when rows are added or removed around the draft. */
  rowCount: number;
}

/**
 * The quick-add row. Tab runs date → description → category → amount (the type switch and
 * the discard button are skipped); Enter saves from any field and Escape discards.
 */
export function DraftRow({ draft, state, categories, homeCurrency, rowCount }: DraftRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const { focusRequest } = state;
  useEffect(() => {
    const fields: Record<DraftField, React.RefObject<HTMLInputElement | null>> = {
      date: dateRef,
      description: descriptionRef,
      category: categoryRef,
      amount: amountRef,
    };
    const input = fields[focusRequest.field].current;
    input?.focus();
    input?.scrollIntoView({ block: 'nearest' });
  }, [focusRequest]);

  // A saved row lands above a bottom draft a moment after the next draft was focused, which
  // would push the draft out of view.
  const isAtBottom = state.position === 'bottom';
  useEffect(() => {
    if (isAtBottom) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isAtBottom, rowCount]);

  const cellClass = (field: DraftField) =>
    cn(CELL_CLASS, 'border-l', state.invalid.includes(field) ? INVALID_CLASS : FOCUS_CLASS);
  const otherType = draft.type === 'expense' ? t.income : t.expense;

  return (
    <tr
      ref={rowRef}
      className="scroll-mt-8 bg-card"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          state.discard();
        } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
          event.preventDefault();
          state.submit();
        }
      }}
    >
      <td className={CELL_CLASS} />

      <td className={cellClass('date')}>
        <DateField
          inputRef={dateRef}
          text={draft.dateText}
          onTextChange={state.setDateText}
          // A day picked with the mouse is final, so move on (and close the calendar).
          onPick={() => state.focus('description')}
          invalid={state.invalid.includes('date')}
        />
      </td>

      <td className={cellClass('description')}>
        <input
          ref={descriptionRef}
          aria-label={t.columns.description}
          autoComplete="off"
          value={draft.description}
          placeholder={t.descriptionPlaceholder}
          className="h-8 w-full bg-transparent px-2 font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
          onChange={(event) => state.setDescription(event.target.value)}
        />
      </td>

      <td className={cellClass('category')}>
        <CategoryCombobox
          inputRef={categoryRef}
          categories={categories}
          selectedId={draft.categoryId}
          preferredType={draft.type}
          onSelect={state.selectCategory}
          // Same for a category picked with the mouse.
          onOptionClick={() => state.focus('amount')}
          invalid={state.invalid.includes('category')}
        />
      </td>

      <td className={cn(CELL_CLASS, 'border-l')}>
        <button
          type="button"
          tabIndex={-1}
          title={interpolate(t.switchType, { type: otherType.toLowerCase() })}
          onClick={state.toggleType}
          className="flex h-8 w-full items-center justify-between gap-1 px-2 outline-none hover:bg-muted"
        >
          <TypeLabel type={draft.type} />
          <ArrowLeftRightIcon className="size-3 text-muted-foreground" />
        </button>
      </td>

      <td className={cellClass('amount')}>
        <AmountInput
          ref={amountRef}
          aria-label={t.columns.amount}
          aria-invalid={state.invalid.includes('amount') || undefined}
          value={draft.amountText}
          onValueChange={state.setAmountText}
          currency={homeCurrency}
          homeCurrency={homeCurrency}
          placeholder={t.amountPlaceholder}
          className={cn(
            'h-8 w-full bg-transparent px-2 text-right font-medium tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground',
            draft.type === 'income' ? 'text-income' : 'text-expense',
          )}
        />
      </td>

      <td className={cn(CELL_CLASS, 'text-center')}>
        <button
          type="button"
          tabIndex={-1}
          aria-label={t.draftHint}
          title={t.draftHint}
          onClick={state.discard}
          className="mx-auto flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}
