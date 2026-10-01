import { type AmountSeparators, parseAmountInput, toAmountInput } from '@/utils/currency';

/**
 * Live formatting of an amount field. The field shows a grouped number ("2.000.000") while
 * its value stays a plain one: digits with an optional "." decimal point ("2000000", "12.5"),
 * which is what `parseAmountInput` gets when the amount is saved.
 */

/** Whole digits beyond this cannot be held exactly in a JavaScript number. */
const MAX_WHOLE_DIGITS = 15;

export interface AmountInputFormat {
  /** Decimals of the currency: 0 for IDR, 2 for USD. */
  decimals: number;
  separators: AmountSeparators;
}

export interface AmountInputState {
  /** The plain value, e.g. "2000000" or "12.5". */
  plain: string;
  /** What the field shows, e.g. "2.000.000" or "12,5". */
  text: string;
  /** Caret position in `text`. */
  caret: number;
}

export interface AmountInputEdit {
  /** The field before the edit: its text and selection. */
  previous: { text: string; selectionStart: number; selectionEnd: number };
  /** The field's raw text after the browser applied the edit. */
  value: string;
  /** Caret position in `value`; after any edit it sits at the end of what changed. */
  caret: number;
  /** `InputEvent.inputType`, when known. */
  inputType?: string;
}

/** Plain value to field text: "1250000.5" is "1.250.000,5" with Indonesian separators. */
export function formatAmountInput(plain: string, { separators }: AmountInputFormat): string {
  if (!plain) return '';
  const [whole, fraction] = plain.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, separators.group);
  return fraction === undefined ? grouped : `${grouped}${separators.decimal}${fraction}`;
}

/** A piece of formatted field text back to plain characters; anything else is dropped. */
function toPlain(text: string, { separators }: AmountInputFormat): string {
  let plain = '';
  for (const char of text) {
    if (char >= '0' && char <= '9') plain += char;
    else if (char === separators.decimal) plain += '.';
  }
  return plain;
}

/**
 * What typed or pasted text adds to the plain value, or null when it cannot be an amount.
 *
 * A single typed separator is always the decimal point, whichever one it is: grouping is
 * inserted automatically, so nobody needs to type it. Pasted text goes through
 * `parseAmountInput`, which tells grouping from decimals ("2.000.000", "2,000,000",
 * "Rp 2.000.000", "1,250.50").
 */
function insertedToPlain(inserted: string, { decimals }: AmountInputFormat): string | null {
  if (inserted.length <= 1) {
    if (inserted >= '0' && inserted <= '9') return inserted;
    return decimals > 0 && (inserted === '.' || inserted === ',') ? '.' : '';
  }
  const trimmed = inserted.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const amount = parseAmountInput(trimmed, decimals);
  if (amount === null) return null;
  const plain = toAmountInput(amount, decimals);
  // Not exponent notation, which a very large number would turn into.
  return /^\d+(\.\d+)?$/.test(plain) ? plain : null;
}

/**
 * Makes a plain value valid, keeping the caret (an index into `plain`) next to the same
 * characters: one decimal point, and only for currencies with decimals; no more fraction
 * digits than the currency has; no leading zeros. Null when the number is too long.
 */
function sanitize(
  plain: string,
  caret: number,
  { decimals }: AmountInputFormat,
): { plain: string; caret: number } | null {
  let result = '';
  let resultCaret = 0;
  let fractionDigits = -1;

  for (let index = 0; index < plain.length; index += 1) {
    const char = plain[index];
    let keep: boolean;
    if (char === '.') {
      keep = decimals > 0 && fractionDigits === -1;
      if (keep) fractionDigits = 0;
    } else if (fractionDigits === -1) {
      keep = true;
    } else {
      keep = fractionDigits < decimals;
      if (keep) fractionDigits += 1;
    }
    if (keep) {
      result += char;
      if (index < caret) resultCaret += 1;
    }
  }

  while (result.length > 1 && result[0] === '0' && result[1] !== '.') {
    result = result.slice(1);
    resultCaret = Math.max(0, resultCaret - 1);
  }
  if (result[0] === '.') {
    result = `0${result}`;
    resultCaret += 1;
  }

  if (result.split('.')[0].length > MAX_WHOLE_DIGITS) return null;
  return { plain: result, caret: resultCaret };
}

/** Index in `text` just after its first `count` plain characters (digits and decimal mark). */
function caretInText(text: string, count: number, { separators }: AmountInputFormat): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== separators.group) seen += 1;
    if (seen === count) return index + 1;
  }
  return text.length;
}

function commonPrefixLength(a: string, b: string): number {
  let length = 0;
  while (length < a.length && length < b.length && a[length] === b[length]) length += 1;
  return length;
}

function build(
  left: string,
  inserted: string,
  right: string,
  format: AmountInputFormat,
): AmountInputState | null {
  const clean = sanitize(left + inserted + right, left.length + inserted.length, format);
  if (!clean) return null;
  const text = formatAmountInput(clean.plain, format);
  return { plain: clean.plain, text, caret: caretInText(text, clean.caret, format) };
}

/**
 * Reformats an amount field after the browser applied an edit (typing, deleting, pasting,
 * cutting), and says where the caret belongs in the reformatted text.
 *
 * - The caret stays after the same digit, however many separators appear or disappear.
 * - Backspace or Delete on a grouping separator removes the digit beyond it, so the key
 *   always does something.
 * - An edit that cannot be an amount (pasted words, a number that is too long) is refused:
 *   the field keeps its previous text.
 */
export function applyAmountEdit(
  edit: AmountInputEdit,
  format: AmountInputFormat,
): AmountInputState {
  const { previous, value, caret, inputType } = edit;
  const { group } = format.separators;
  const { text: before, selectionStart, selectionEnd } = previous;

  const refused = (): AmountInputState => ({
    plain: toPlain(before, format),
    text: before,
    caret: Math.min(selectionEnd, before.length),
  });

  if (selectionStart === selectionEnd && value.length === before.length - 1) {
    if (inputType === 'deleteContentBackward' && before[selectionStart - 1] === group) {
      return (
        build(
          toPlain(before.slice(0, selectionStart - 2), format),
          '',
          toPlain(before.slice(selectionStart), format),
          format,
        ) ?? refused()
      );
    }
    if (inputType === 'deleteContentForward' && before[selectionStart] === group) {
      return (
        build(
          toPlain(before.slice(0, selectionStart), format),
          '',
          toPlain(before.slice(selectionStart + 2), format),
          format,
        ) ?? refused()
      );
    }
  }

  // Everything after the caret is untouched text; the edit ends at the caret.
  let right = value.slice(caret);
  let start: number;
  if (
    selectionStart <= caret &&
    value.slice(0, selectionStart) === before.slice(0, selectionStart) &&
    before.slice(selectionEnd) === right
  ) {
    start = selectionStart;
  } else if (before.endsWith(right)) {
    // The selection is unknown or stale: find where the texts start to differ.
    start = commonPrefixLength(
      before.slice(0, before.length - right.length),
      value.slice(0, caret),
    );
  } else {
    // Not an edit of the previous text (autofill, drop): take the whole value as new.
    start = 0;
    right = '';
  }

  const inserted = insertedToPlain(value.slice(start, value.length - right.length), format);
  if (inserted === null) return refused();
  return (
    build(toPlain(value.slice(0, start), format), inserted, toPlain(right, format), format) ??
    refused()
  );
}
