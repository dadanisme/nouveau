import { describe, expect, it } from 'vitest';

import { type AmountInputFormat, applyAmountEdit, formatAmountInput } from '@/utils/amount-input';
import { amountSeparators } from '@/utils/currency';

/** IDR in an IDR workspace: "." groups, no decimals. */
const idr: AmountInputFormat = { decimals: 0, separators: amountSeparators('IDR', 'IDR') };
/** USD in an IDR workspace (a foreign row): "," groups, "." is the decimal point. */
const usd: AmountInputFormat = { decimals: 2, separators: amountSeparators('USD', 'IDR') };
/** USD in a USD workspace: displayed the Indonesian way, "," is the decimal mark. */
const usdHome: AmountInputFormat = { decimals: 2, separators: amountSeparators('USD', 'USD') };

/**
 * Applies an edit the way a browser would. `|` marks the caret and `[...]` a selection in
 * the field before the edit; the result is written the same way.
 */
function edit(
  before: string,
  action: { type: string } | { paste: string } | 'backspace' | 'delete',
  format: AmountInputFormat,
): { field: string; plain: string } {
  const open = before.indexOf('[');
  let text: string;
  let start: number;
  let end: number;
  if (open !== -1) {
    text = before.replace(/[[\]]/g, '');
    start = open;
    end = before.indexOf(']') - 1;
  } else {
    text = before.replace('|', '');
    start = end = before.indexOf('|');
  }

  let value: string;
  let caret: number;
  let inputType: string;
  if (action === 'backspace' || action === 'delete') {
    inputType = action === 'backspace' ? 'deleteContentBackward' : 'deleteContentForward';
    if (start !== end) {
      value = text.slice(0, start) + text.slice(end);
      caret = start;
    } else if (action === 'backspace') {
      value = text.slice(0, Math.max(0, start - 1)) + text.slice(start);
      caret = Math.max(0, start - 1);
    } else {
      value = text.slice(0, start) + text.slice(start + 1);
      caret = start;
    }
  } else {
    const inserted = 'type' in action ? action.type : action.paste;
    inputType = 'type' in action ? 'insertText' : 'insertFromPaste';
    value = text.slice(0, start) + inserted + text.slice(end);
    caret = start + inserted.length;
  }

  const result = applyAmountEdit(
    { previous: { text, selectionStart: start, selectionEnd: end }, value, caret, inputType },
    format,
  );
  return {
    field: `${result.text.slice(0, result.caret)}|${result.text.slice(result.caret)}`,
    plain: result.plain,
  };
}

/** Types characters one at a time, starting from `before`. */
function type(before: string, keys: string, format: AmountInputFormat) {
  let state = { field: before, plain: '' };
  for (const key of keys) state = edit(state.field, { type: key }, format);
  return state;
}

describe('formatAmountInput', () => {
  it('groups whole digits with the display separators', () => {
    expect(formatAmountInput('2000000', idr)).toBe('2.000.000');
    expect(formatAmountInput('999', idr)).toBe('999');
    expect(formatAmountInput('1000', idr)).toBe('1.000');
    expect(formatAmountInput('', idr)).toBe('');
  });

  it('keeps the fraction as typed, with the right decimal mark', () => {
    expect(formatAmountInput('1234.5', usd)).toBe('1,234.5');
    expect(formatAmountInput('1234.50', usd)).toBe('1,234.50');
    expect(formatAmountInput('12.', usd)).toBe('12.');
    expect(formatAmountInput('1234.5', usdHome)).toBe('1.234,5');
  });

  it('is exact for numbers beyond float precision', () => {
    expect(formatAmountInput('999999999999999', idr)).toBe('999.999.999.999.999');
  });
});

describe('applyAmountEdit: typing', () => {
  it('groups while typing and keeps the plain value', () => {
    expect(type('|', '2000000', idr)).toEqual({ field: '2.000.000|', plain: '2000000' });
    expect(type('|', '1234', idr)).toEqual({ field: '1.234|', plain: '1234' });
  });

  it('keeps the caret after the typed digit in the middle', () => {
    expect(edit('2|.000', { type: '5' }, idr)).toEqual({ field: '25|.000', plain: '25000' });
    expect(edit('25|.000', { type: '5' }, idr)).toEqual({ field: '255|.000', plain: '255000' });
    expect(edit('255|.000', { type: '5' }, idr)).toEqual({
      field: '2.555|.000',
      plain: '2555000',
    });
    expect(edit('|1.000', { type: '2' }, idr)).toEqual({ field: '2|1.000', plain: '21000' });
    expect(edit('1.0|00', { type: '7' }, idr)).toEqual({ field: '10.7|00', plain: '10700' });
  });

  it('replaces a selection', () => {
    expect(edit('[2.000.000]', { type: '5' }, idr)).toEqual({ field: '5|', plain: '5' });
    expect(edit('1[2.3]45', { type: '9' }, idr)).toEqual({ field: '1.9|45', plain: '1945' });
    // Typing the digit that is already first leaves the same text behind.
    expect(edit('[5.000]', { type: '5' }, idr)).toEqual({ field: '5|', plain: '5' });
  });

  it('ignores anything that is not part of a number', () => {
    expect(edit('1.0|00', { type: 'a' }, idr)).toEqual({ field: '1.0|00', plain: '1000' });
    expect(edit('|', { type: '-' }, idr)).toEqual({ field: '|', plain: '' });
  });

  it('has no decimals for zero-decimal currencies', () => {
    expect(type('|', '12.5', idr)).toEqual({ field: '125|', plain: '125' });
    expect(edit('2|.000', { type: ',' }, idr)).toEqual({ field: '2|.000', plain: '2000' });
  });

  it('takes a typed separator as the decimal point for currencies with decimals', () => {
    expect(type('|', '1234.5', usd)).toEqual({ field: '1,234.5|', plain: '1234.5' });
    expect(type('|', '1234,5', usd)).toEqual({ field: '1,234.5|', plain: '1234.5' });
    expect(type('|', '1234,5', usdHome)).toEqual({ field: '1.234,5|', plain: '1234.5' });
    expect(type('|', '1234.5', usdHome)).toEqual({ field: '1.234,5|', plain: '1234.5' });
  });

  it('allows one decimal point and no more decimals than the currency has', () => {
    expect(type('|', '12.345', usd)).toEqual({ field: '12.34|', plain: '12.34' });
    expect(edit('12.3|', { type: '.' }, usd)).toEqual({ field: '12.3|', plain: '12.3' });
    expect(type('|', '.5', usd)).toEqual({ field: '0.5|', plain: '0.5' });
    expect(edit('12.|50', { type: '7' }, usd)).toEqual({ field: '12.7|5', plain: '12.75' });
  });

  it('drops leading zeros', () => {
    expect(type('|', '007', idr)).toEqual({ field: '7|', plain: '7' });
    expect(type('|', '0.5', usd)).toEqual({ field: '0.5|', plain: '0.5' });
    expect(edit('|1.000', { type: '0' }, idr)).toEqual({ field: '|1.000', plain: '1000' });
  });

  it('refuses digits beyond what a number holds exactly', () => {
    expect(edit('999.999.999.999.999|', { type: '9' }, idr)).toEqual({
      field: '999.999.999.999.999|',
      plain: '999999999999999',
    });
  });
});

describe('applyAmountEdit: deleting', () => {
  it('regroups after Backspace and Delete on a digit', () => {
    expect(edit('2.000.000|', 'backspace', idr)).toEqual({ field: '200.000|', plain: '200000' });
    expect(edit('1.2|34', 'backspace', idr)).toEqual({ field: '1|34', plain: '134' });
    expect(edit('|1.234', 'delete', idr)).toEqual({ field: '|234', plain: '234' });
    expect(edit('12.3|45', 'delete', idr)).toEqual({ field: '1.23|5', plain: '1235' });
  });

  it('removes the digit beyond a grouping separator', () => {
    expect(edit('2.|000', 'backspace', idr)).toEqual({ field: '|0', plain: '0' });
    expect(edit('12.|345', 'backspace', idr)).toEqual({ field: '1|.345', plain: '1345' });
    expect(edit('12|.345', 'delete', idr)).toEqual({ field: '1.2|45', plain: '1245' });
    expect(edit('1,|234.5', 'backspace', usd)).toEqual({ field: '|234.5', plain: '234.5' });
  });

  it('removes a decimal point like any character', () => {
    expect(edit('1,234.|5', 'backspace', usd)).toEqual({ field: '12,34|5', plain: '12345' });
    expect(edit('12|.5', 'delete', usd)).toEqual({ field: '12|5', plain: '125' });
  });

  it('clears the field', () => {
    expect(edit('[2.000.000]', 'backspace', idr)).toEqual({ field: '|', plain: '' });
    expect(edit('5|', 'backspace', idr)).toEqual({ field: '|', plain: '' });
  });

  it('deletes a selection across separators', () => {
    expect(edit('1[2.3]45', 'delete', idr)).toEqual({ field: '1|45', plain: '145' });
  });
});

describe('applyAmountEdit: pasting', () => {
  it('reads the usual ways of writing an amount', () => {
    for (const text of ['2000000', '2.000.000', '2,000,000', 'Rp 2.000.000', ' 2000000 ']) {
      expect(edit('|', { paste: text }, idr)).toEqual({ field: '2.000.000|', plain: '2000000' });
    }
  });

  it('replaces what is selected', () => {
    expect(edit('[2.000]', { paste: '2.000.000' }, idr)).toEqual({
      field: '2.000.000|',
      plain: '2000000',
    });
    expect(edit('[85.000]', { paste: 'Rp 2.000.000' }, idr)).toEqual({
      field: '2.000.000|',
      plain: '2000000',
    });
  });

  it('inserts at the caret', () => {
    expect(edit('1|.000', { paste: '50' }, idr)).toEqual({ field: '150|.000', plain: '150000' });
  });

  it('tells grouping from decimals for currencies with decimals', () => {
    expect(edit('|', { paste: '1,250.50' }, usd)).toEqual({ field: '1,250.5|', plain: '1250.5' });
    expect(edit('|', { paste: '1.250,50' }, usd)).toEqual({ field: '1,250.5|', plain: '1250.5' });
    expect(edit('|', { paste: '$12.5' }, usd)).toEqual({ field: '12.5|', plain: '12.5' });
    expect(edit('|', { paste: '2,000,000' }, usdHome)).toEqual({
      field: '2.000.000|',
      plain: '2000000',
    });
  });

  it('refuses text that is not an amount, keeping the field as it was', () => {
    expect(edit('1.0|00', { paste: 'hello' }, idr)).toEqual({ field: '1.0|00', plain: '1000' });
    expect(edit('[1.000]', { paste: '12.5' }, idr)).toEqual({ field: '1.000|', plain: '1000' });
    expect(edit('|', { paste: '1.2.3' }, usd)).toEqual({ field: '|', plain: '' });
  });
});

describe('applyAmountEdit: unknown selection', () => {
  it('finds the edit by comparing texts when the remembered selection is stale', () => {
    const result = applyAmountEdit(
      {
        previous: { text: '2.000', selectionStart: 0, selectionEnd: 0 },
        value: '2.0500',
        caret: 4,
        inputType: 'insertText',
      },
      idr,
    );
    expect(result).toEqual({ plain: '20500', text: '20.500', caret: 4 });
  });

  it('takes a value that replaces the whole field', () => {
    const result = applyAmountEdit(
      {
        previous: { text: '2.000', selectionStart: 5, selectionEnd: 5 },
        value: '1500000',
        caret: 0,
        inputType: 'insertReplacementText',
      },
      idr,
    );
    expect(result).toEqual({ plain: '1500000', text: '1.500.000', caret: 9 });
  });
});
