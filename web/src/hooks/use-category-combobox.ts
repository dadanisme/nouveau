import { useMemo, useState } from 'react';

import type { Category, TransactionType } from '@/types/transaction';
import { filterCategories } from '@/utils/category';

interface UseCategoryComboboxOptions {
  categories: Category[];
  selectedId: string | null;
  /** Categories of this type are listed first. */
  preferredType?: TransactionType;
  onSelect: (category: Category) => void;
}

/** Search text, keyboard highlight and selection for the category pickers. */
export function useCategoryCombobox({
  categories,
  selectedId,
  preferredType,
  onSelect,
}: UseCategoryComboboxOptions) {
  const [query, setQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const options = useMemo(
    () => filterCategories(categories, query, preferredType),
    [categories, query, preferredType],
  );

  // Explicit highlight first; while searching the best match; otherwise the current value.
  const active =
    options.find((option) => option.id === highlightedId) ??
    (query.trim() ? options[0] : options.find((option) => option.id === selectedId)) ??
    null;

  const reset = () => {
    setQuery('');
    setHighlightedId(null);
  };

  const choose = (category: Category) => {
    onSelect(category);
    reset();
  };

  const move = (delta: number) => {
    if (options.length === 0) return;
    const index = active ? options.indexOf(active) : -1;
    const next = Math.min(Math.max(index + delta, 0), options.length - 1);
    setHighlightedId(options[next].id);
  };

  /**
   * Arrow keys move the highlight; Enter picks it; Tab picks it when a search is typed, then
   * moves on. Returns true when the key was consumed. Enter is only consumed when it changes
   * the selection, so a surrounding row can treat an untouched Enter as "save".
   */
  const handleKeyDown = (event: React.KeyboardEvent): boolean => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(event.key === 'ArrowDown' ? 1 : -1);
      return true;
    }
    if (event.key === 'Enter' && active && (query.trim() || active.id !== selectedId)) {
      event.preventDefault();
      event.stopPropagation();
      choose(active);
      return true;
    }
    if (event.key === 'Tab' && active && query.trim()) choose(active);
    return false;
  };

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setHighlightedId(null);
    },
    options,
    activeId: active?.id ?? null,
    highlight: setHighlightedId,
    choose,
    reset,
    handleKeyDown,
  };
}
