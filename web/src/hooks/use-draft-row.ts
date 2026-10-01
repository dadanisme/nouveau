import { useState } from 'react';

import type {
  Category,
  DraftField,
  DraftTransaction,
  TransactionCategory,
} from '@/types/transaction';
import { toLocalDateString } from '@/utils/date';
import { type DraftResult, emptyDraft } from '@/utils/transaction';

interface UseDraftRowOptions {
  categories: Category[];
  /** Validates and saves the draft; null when saving is not possible right now. */
  onSubmit: (draft: DraftTransaction) => DraftResult | null;
}

export type DraftRow = ReturnType<typeof useDraftRow>;

/**
 * State of the quick-add row. It opens with today's date, or the last date saved in this
 * session, and after a save it immediately starts the next row on the same date.
 */
export function useDraftRow({ categories, onSubmit }: UseDraftRowOptions) {
  const [draft, setDraft] = useState<DraftTransaction | null>(null);
  const [invalid, setInvalid] = useState<DraftField[]>([]);
  const [lastDate, setLastDate] = useState<string | null>(null);
  // Bumping `token` asks the row to move focus to `field`.
  const [focusRequest, setFocusRequest] = useState<{ field: DraftField; token: number }>({
    field: 'description',
    token: 0,
  });

  const focus = (field: DraftField) =>
    setFocusRequest(({ token }) => ({ field, token: token + 1 }));

  const open = () => {
    setDraft((current) => current ?? emptyDraft(lastDate ?? toLocalDateString(new Date())));
    focus('description');
  };

  const discard = () => {
    setDraft(null);
    setInvalid([]);
  };

  const update = (changes: Partial<DraftTransaction>, cleared: DraftField) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
    setInvalid((fields) => fields.filter((field) => field !== cleared));
  };

  const selectCategory = (category: TransactionCategory) => {
    const type = category.type === 'income' || category.type === 'expense' ? category.type : null;
    update({ categoryId: category.id, ...(type ? { type } : {}) }, 'category');
  };

  /** Flips expense/income. A category of the other type no longer fits, so it is cleared. */
  const toggleType = () => {
    setDraft((current) => {
      if (!current) return current;
      const type = current.type === 'expense' ? 'income' : 'expense';
      const category = categories.find((item) => item.id === current.categoryId);
      return { ...current, type, categoryId: category?.type === type ? category.id : null };
    });
  };

  const submit = () => {
    if (!draft) return;
    const result = onSubmit(draft);
    if (!result) return;
    if (!result.ok) {
      setInvalid(result.invalid);
      focus(result.invalid[0]);
      return;
    }
    const { date } = result.transaction;
    setLastDate(date);
    setInvalid([]);
    setDraft(emptyDraft(date));
    focus('description');
  };

  return {
    draft,
    isOpen: draft !== null,
    invalid,
    focusRequest,
    open,
    discard,
    submit,
    selectCategory,
    toggleType,
    setDateText: (dateText: string) => update({ dateText }, 'date'),
    setDescription: (description: string) => update({ description }, 'description'),
    setAmountText: (amountText: string) => update({ amountText }, 'amount'),
  };
}
