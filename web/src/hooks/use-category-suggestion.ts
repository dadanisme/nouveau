import { useEffect, useEffectEvent, useRef } from 'react';

import { useClassifyDescription } from '@/hooks/use-classify-description';
import type { Category } from '@/types/transaction';

/** Mobile waits this long after the last keystroke before classifying. */
const CLASSIFY_DEBOUNCE_MS = 1000;

interface UseCategorySuggestionOptions {
  description: string;
  categories: Category[];
  /** False once the user has picked a category themselves, or when there is no new row. */
  enabled: boolean;
  /** Called with the suggested category and the description it was suggested for. */
  onSuggest: (category: Category, description: string) => void;
}

/**
 * AI category suggestion with the trigger rules of mobile's add form: one second after the
 * description stops changing, when it is not empty, differs from the last one classified and
 * categories are loaded. Errors (including the feature not being enabled for the user) and
 * unknown category ids are ignored silently.
 */
export function useCategorySuggestion({
  description,
  categories,
  enabled,
  onSuggest,
}: UseCategorySuggestionOptions) {
  const { mutate: classifyDescription } = useClassifyDescription();
  const lastClassified = useRef<string | null>(null);
  const suggest = useEffectEvent(onSuggest);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = description.trim();
    if (!trimmed) return;
    if (trimmed === lastClassified.current) return;
    if (!categories.length) return;

    const timer = setTimeout(() => {
      lastClassified.current = trimmed;
      classifyDescription(trimmed, {
        onSuccess: (result) => {
          const matched = categories.find((category) => category.id === result.category_id);
          if (matched) suggest(matched, trimmed);
        },
      });
    }, CLASSIFY_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [description, categories, enabled, classifyDescription]);
}
