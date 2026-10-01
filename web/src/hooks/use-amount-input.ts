import { useLayoutEffect, useReducer, useRef } from 'react';

import { applyAmountEdit, formatAmountInput } from '@/utils/amount-input';
import { amountSeparators, currencyDecimals } from '@/utils/currency';

interface UseAmountInputOptions {
  /** The plain amount: digits with an optional "." decimal point. */
  value: string;
  onValueChange: (value: string) => void;
  currency: string;
  homeCurrency: string;
}

/**
 * Drives an amount field that groups digits while typing. The field shows the formatted
 * text, the owner keeps the plain value, and the caret is put back where it belongs after
 * every edit (rewriting an input's value would otherwise send it to the end).
 */
export function useAmountInput({
  value,
  onValueChange,
  currency,
  homeCurrency,
}: UseAmountInputOptions) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  // The selection just before an edit, read when the key goes down or the paste starts.
  const selection = useRef<{ start: number; end: number } | null>(null);
  const pendingCaret = useRef<number | null>(null);
  // A refused edit leaves the value unchanged, but the caret still has to be restored.
  const [, rerender] = useReducer((count: number) => count + 1, 0);

  const format = {
    decimals: currencyDecimals(currency),
    separators: amountSeparators(currency, homeCurrency),
  };
  const text = formatAmountInput(value, format);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    if (caret === null || !input || document.activeElement !== input) return;
    input.setSelectionRange(caret, caret);
  });

  const rememberSelection = (input: HTMLInputElement) => {
    selection.current = {
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
    };
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const caret = input.selectionStart ?? input.value.length;
    const next = applyAmountEdit(
      {
        previous: {
          text,
          selectionStart: selection.current?.start ?? caret,
          selectionEnd: selection.current?.end ?? caret,
        },
        value: input.value,
        caret,
        inputType: (event.nativeEvent as InputEvent).inputType,
      },
      format,
    );
    // A key held down edits again without another keydown.
    selection.current = { start: next.caret, end: next.caret };
    pendingCaret.current = next.caret;
    onValueChange(next.plain);
    rerender();
  };

  return { inputRef, text, handleChange, rememberSelection };
}
