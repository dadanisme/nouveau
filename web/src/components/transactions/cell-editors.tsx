import { useRef, useState } from 'react';

import { AmountInput } from '@/components/transactions/amount-input';
import { CategoryCombobox } from '@/components/transactions/category-picker';
import { DateField } from '@/components/transactions/date-field';
import { cn } from '@/lib/utils';
import type { Category, TransactionType } from '@/types/transaction';

/**
 * Editors finish exactly once: Enter (or a pick) commits, Escape cancels, and a blur that
 * was not caused by either commits. The guard stops the blur that follows Enter or Escape
 * from committing a second time.
 */
function useFinishOnce() {
  const isDone = useRef(false);
  return (finish: () => void) => {
    if (isDone.current) return;
    isDone.current = true;
    finish();
  };
}

interface TextCellEditorProps {
  initialValue: string;
  label: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
  maxLength?: number;
}

/** Text editor for description and category name cells. */
export function TextCellEditor({
  initialValue,
  label,
  onCommit,
  onCancel,
  maxLength,
}: TextCellEditorProps) {
  const [text, setText] = useState(initialValue);
  const finishOnce = useFinishOnce();

  return (
    <input
      autoFocus
      aria-label={label}
      autoComplete="off"
      maxLength={maxLength}
      value={text}
      className="h-8 w-full bg-transparent px-2 outline-none"
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={() => finishOnce(() => onCommit(text))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finishOnce(() => onCommit(text));
        else if (event.key === 'Escape') finishOnce(onCancel);
      }}
    />
  );
}

interface AmountCellEditorProps {
  /** The plain amount the editor starts with, e.g. "1250000". */
  initialValue: string;
  label: string;
  /** The amount's own currency and the workspace's: they decide decimals and separators. */
  currency: string;
  homeCurrency: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
  align?: 'left' | 'right';
}

/** Amount editor: digits are grouped while typing, the committed text is the plain number. */
export function AmountCellEditor({
  initialValue,
  label,
  currency,
  homeCurrency,
  onCommit,
  onCancel,
  align = 'left',
}: AmountCellEditorProps) {
  const [value, setValue] = useState(initialValue);
  const finishOnce = useFinishOnce();

  return (
    <AmountInput
      autoFocus
      aria-label={label}
      value={value}
      onValueChange={setValue}
      currency={currency}
      homeCurrency={homeCurrency}
      className={cn(
        'h-8 w-full bg-transparent px-2 tabular-nums outline-none',
        align === 'right' && 'text-right',
      )}
      onFocus={(event) => event.target.select()}
      onBlur={() => finishOnce(() => onCommit(value))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finishOnce(() => onCommit(value));
        else if (event.key === 'Escape') finishOnce(onCancel);
      }}
    />
  );
}

interface DateCellEditorProps {
  initialValue: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export function DateCellEditor({ initialValue, onCommit, onCancel }: DateCellEditorProps) {
  const [text, setText] = useState(initialValue);
  const finishOnce = useFinishOnce();

  return (
    <DateField
      autoFocus
      text={text}
      onTextChange={setText}
      onPick={(dateKey) => finishOnce(() => onCommit(dateKey))}
      onBlur={() => finishOnce(() => onCommit(text))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finishOnce(() => onCommit(text));
        else if (event.key === 'Escape') finishOnce(onCancel);
      }}
    />
  );
}

interface CategoryCellEditorProps {
  categories: Category[];
  selectedId: string;
  preferredType: TransactionType;
  onCommit: (category: Category) => void;
  onCancel: () => void;
}

export function CategoryCellEditor({
  categories,
  selectedId,
  preferredType,
  onCommit,
  onCancel,
}: CategoryCellEditorProps) {
  const finishOnce = useFinishOnce();

  return (
    <CategoryCombobox
      autoFocus
      categories={categories}
      selectedId={selectedId}
      preferredType={preferredType}
      onSelect={(category) => finishOnce(() => onCommit(category))}
      // Leaving without picking keeps the current category.
      onBlur={() => finishOnce(onCancel)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === 'Escape') finishOnce(onCancel);
      }}
    />
  );
}
