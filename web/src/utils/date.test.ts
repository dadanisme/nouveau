import { describe, expect, it } from 'vitest';

import {
  currentYearMonth,
  formatDate,
  formatMonthLabel,
  formatRangeLabel,
  isDateInRange,
  isSameMonth,
  monthRange,
  normalizeRange,
  parseDateInput,
  parseDateKey,
  shiftMonth,
  startOfPreviousMonth,
  toDateKey,
  toLocalDateString,
} from '@/utils/date';

describe('toLocalDateString / toDateKey', () => {
  it('formats in local time with zero padding', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalDateString(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('strips a time component', () => {
    expect(toDateKey('2026-03-15')).toBe('2026-03-15');
    expect(toDateKey('2026-03-15T10:00:00+00:00')).toBe('2026-03-15');
  });
});

describe('parseDateKey', () => {
  it('returns local midnight for a real date', () => {
    const date = parseDateKey('2026-03-15');
    expect(date).toEqual(new Date(2026, 2, 15));
  });

  it('rejects malformed and impossible dates', () => {
    expect(parseDateKey('2026-3-15')).toBeNull();
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('not a date')).toBeNull();
  });
});

describe('monthRange', () => {
  it('covers the first to the last day of the month', () => {
    expect(monthRange({ year: 2026, month: 9 })).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthRange({ year: 2026, month: 3 })).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('handles February in leap and common years', () => {
    expect(monthRange({ year: 2024, month: 1 }).to).toBe('2024-02-29');
    expect(monthRange({ year: 2026, month: 1 }).to).toBe('2026-02-28');
  });
});

describe('shiftMonth', () => {
  it('moves within a year', () => {
    expect(shiftMonth({ year: 2026, month: 5 }, 1)).toEqual({ year: 2026, month: 6 });
    expect(shiftMonth({ year: 2026, month: 5 }, -1)).toEqual({ year: 2026, month: 4 });
  });

  it('rolls over year boundaries in both directions', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 0 }, -13)).toEqual({ year: 2024, month: 11 });
    expect(shiftMonth({ year: 2026, month: 6 }, 18)).toEqual({ year: 2028, month: 0 });
  });
});

describe('currentYearMonth / isSameMonth', () => {
  it('reads the month from a date', () => {
    expect(currentYearMonth(new Date(2026, 9, 1))).toEqual({ year: 2026, month: 9 });
  });

  it('compares year and month', () => {
    expect(isSameMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(isSameMonth({ year: 2026, month: 9 }, { year: 2025, month: 9 })).toBe(false);
    expect(isSameMonth({ year: 2026, month: 9 }, { year: 2026, month: 8 })).toBe(false);
  });
});

describe('normalizeRange / isDateInRange', () => {
  it('orders the two ends', () => {
    expect(normalizeRange('2026-10-15', '2026-09-01')).toEqual({
      from: '2026-09-01',
      to: '2026-10-15',
    });
    expect(normalizeRange('2026-09-01', '2026-09-01')).toEqual({
      from: '2026-09-01',
      to: '2026-09-01',
    });
  });

  it('is inclusive at both ends and ignores a time component', () => {
    const range = { from: '2026-10-01', to: '2026-10-31' };
    expect(isDateInRange('2026-10-01', range)).toBe(true);
    expect(isDateInRange('2026-10-31T23:59:59', range)).toBe(true);
    expect(isDateInRange('2026-09-30', range)).toBe(false);
    expect(isDateInRange('2026-11-01', range)).toBe(false);
  });
});

describe('parseDateInput', () => {
  const reference = new Date(2026, 9, 1); // 1 Oct 2026

  it('accepts ISO dates', () => {
    expect(parseDateInput('2026-03-15', reference)).toBe('2026-03-15');
    expect(parseDateInput(' 2026/3/5 ', reference)).toBe('2026-03-05');
  });

  it('accepts day-first shorthand, filling missing parts from the reference date', () => {
    expect(parseDateInput('15', reference)).toBe('2026-10-15');
    expect(parseDateInput('15/3', reference)).toBe('2026-03-15');
    expect(parseDateInput('15-3-25', reference)).toBe('2025-03-15');
    expect(parseDateInput('15.03.2025', reference)).toBe('2025-03-15');
    expect(parseDateInput('5 3', reference)).toBe('2026-03-05');
  });

  it('rejects impossible or malformed dates', () => {
    expect(parseDateInput('', reference)).toBeNull();
    expect(parseDateInput('31/2', reference)).toBeNull();
    expect(parseDateInput('32', reference)).toBeNull();
    expect(parseDateInput('0', reference)).toBeNull();
    expect(parseDateInput('15/13', reference)).toBeNull();
    expect(parseDateInput('2026-02-30', reference)).toBeNull();
    expect(parseDateInput('15/3/202', reference)).toBeNull();
    expect(parseDateInput('yesterday', reference)).toBeNull();
    expect(parseDateInput('1/2/3/4', reference)).toBeNull();
  });
});

describe('labels', () => {
  it('formats months, dates and ranges', () => {
    expect(formatMonthLabel({ year: 2026, month: 9 })).toBe('October 2026');
    expect(formatDate('2026-10-01')).toBe('Oct 1, 2026');
    expect(formatDate('2026-10-01T08:00:00')).toBe('Oct 1, 2026');
    expect(formatRangeLabel({ from: '2026-09-01', to: '2026-10-15' })).toBe(
      'Sep 1, 2026 – Oct 15, 2026',
    );
    expect(formatRangeLabel({ from: '2026-09-01', to: '2026-09-01' })).toBe('Sep 1, 2026');
  });
});

describe('startOfPreviousMonth', () => {
  it('is the first day of the month before', () => {
    expect(toLocalDateString(startOfPreviousMonth('2026-10-31')!)).toBe('2026-09-01');
    expect(toLocalDateString(startOfPreviousMonth('2026-01-15')!)).toBe('2025-12-01');
    expect(toLocalDateString(startOfPreviousMonth('2026-03-31')!)).toBe('2026-02-01');
  });

  it('is null for an invalid date', () => {
    expect(startOfPreviousMonth('nope')).toBeNull();
  });
});
