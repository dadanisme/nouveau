import { useState } from 'react';

import { useCategorySuggestion } from '@/hooks/use-category-suggestion';
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

/** Where the quick-add row sits: above the first row ("+ New" button, `N`) or below the last. */
export type DraftPosition = 'top' | 'bottom';

/**
 * State of the quick-add row. It opens with today's date, or the last date saved in this
 * session, and after a save it immediately starts the next row on the same date. While the
 * description is typed, the category is suggested by the classifier until the user picks one.
 * There is only ever one draft: opening it from the other end of the table moves it there with
 * whatever was typed.
 */
export function useDraftRow({ categories, onSubmit }: UseDraftRowOptions) {
  const [draft, setDraft] = useState<DraftTransaction | null>(null);
  const [invalid, setInvalid] = useState<DraftField[]>([]);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [position, setPosition] = useState<DraftPosition>('top');
  // After a bottom draft is discarded, focus goes back to the "+ New" row it replaced.
  const [returnFocusToNewRow, setReturnFocusToNewRow] = useState(false);
  // Once the user picks a category for this row, a suggestion must not replace it (as on
  // mobile). Every new row starts unpicked.
  const [hasPickedCategory, setHasPickedCategory] = useState(false);
  // Bumping `token` asks the row to move focus to `field`.
  const [focusRequest, setFocusRequest] = useState<{ field: DraftField; token: number }>({
    field: 'description',
    token: 0,
  });

  const focus = (field: DraftField) =>
    setFocusRequest(({ token }) => ({ field, token: token + 1 }));

  const open = (at: DraftPosition) => {
    setPosition(at);
    setReturnFocusToNewRow(false);
    setDraft((current) => current ?? emptyDraft(lastDate ?? toLocalDateString(new Date())));
    focus('description');
  };

  const discard = () => {
    setReturnFocusToNewRow(draft !== null && position === 'bottom');
    setDraft(null);
    setInvalid([]);
    setHasPickedCategory(false);
  };

  const update = (changes: Partial<DraftTransaction>, cleared: DraftField) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
    setInvalid((fields) => fields.filter((field) => field !== cleared));
  };

  const applyCategory = (category: TransactionCategory) => {
    const type = category.type === 'income' || category.type === 'expense' ? category.type : null;
    update({ categoryId: category.id, ...(type ? { type } : {}) }, 'category');
  };

  const selectCategory = (category: TransactionCategory) => {
    setHasPickedCategory(true);
    applyCategory(category);
  };

  useCategorySuggestion({
    description: draft?.description ?? '',
    categories,
    enabled: draft !== null && !hasPickedCategory,
    onSuggest: (category, description) => {
      // The answer can arrive after the row was saved or its description changed again.
      if (hasPickedCategory || draft?.description.trim() !== description) return;
      applyCategory(category);
    },
  });

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
    setHasPickedCategory(false);
    setDraft(emptyDraft(date));
    focus('description');
  };

  return {
    draft,
    isOpen: draft !== null,
    position,
    returnFocusToNewRow,
    invalid,
    focusRequest,
    focus,
    openAtTop: () => open('top'),
    openAtBottom: () => open('bottom'),
    discard,
    submit,
    selectCategory,
    toggleType,
    setDateText: (dateText: string) => update({ dateText }, 'date'),
    setDescription: (description: string) => update({ description }, 'description'),
    setAmountText: (amountText: string) => update({ amountText }, 'amount'),
  };
}
