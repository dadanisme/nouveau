import type { DateRange, YearMonth } from '@/types/transaction';

/** English only for v1 (mobile switches this with the app language). */
const DATE_LOCALE = 'en-US';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Format a Date as YYYY-MM-DD using local timezone (avoids UTC shift). */
export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The date part of a `date` column value, which may carry a time component. */
export function toDateKey(value: string): string {
  return value.split('T')[0];
}

function buildDateKey(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal && year >= 1900 && year <= 2999 ? toLocalDateString(date) : null;
}

/** Local midnight for a `YYYY-MM-DD` key, or null when it is not a real calendar date. */
export function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toDateKey(value));
  if (!match) return null;
  const key = buildDateKey(Number(match[1]), Number(match[2]), Number(match[3]));
  return key ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

/**
 * Parses what a user types into a date cell. Accepts `YYYY-MM-DD`, or day-first forms with
 * the missing parts taken from `reference`: `15`, `15/3`, `15/3/26`, `15/3/2026`
 * (separators `/`, `-`, `.` or space). Returns a `YYYY-MM-DD` key, or null when invalid.
 */
export function parseDateInput(input: string, reference: Date): string | null {
  const text = input.trim();
  if (!text) return null;

  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  if (iso) return buildDateKey(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const parts = text.split(/[-/.\s]+/);
  if (parts.length > 3 || parts.some((part) => !/^\d{1,4}$/.test(part))) return null;
  const [day, month, year] = parts.map(Number);
  if (parts[0].length > 2 || (parts[1] && parts[1].length > 2)) return null;

  let fullYear = reference.getFullYear();
  if (parts[2]) {
    if (parts[2].length === 2) fullYear = 2000 + year;
    else if (parts[2].length === 4) fullYear = year;
    else return null;
  }
  return buildDateKey(fullYear, month ?? reference.getMonth() + 1, day);
}

export function currentYearMonth(now: Date = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/** First day of the month before the one `dateKey` falls in, or null for an invalid key. */
export function startOfPreviousMonth(dateKey: string): Date | null {
  const date = parseDateKey(dateKey);
  return date ? new Date(date.getFullYear(), date.getMonth() - 1, 1) : null;
}

export function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** First and last day of a month, the same bounds mobile queries with. */
export function monthRange({ year, month }: YearMonth): DateRange {
  const prefix = `${year}-${pad(month + 1)}`;
  return { from: `${prefix}-01`, to: `${prefix}-${pad(getDaysInMonth(year, month))}` };
}

/** Orders two date keys into a range, so a range picked backwards still works. */
export function normalizeRange(a: string, b: string): DateRange {
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

export function isDateInRange(value: string, range: DateRange): boolean {
  const key = toDateKey(value);
  return key >= range.from && key <= range.to;
}

export function formatMonthLabel({ year, month }: YearMonth): string {
  return new Date(year, month).toLocaleDateString(DATE_LOCALE, { month: 'long', year: 'numeric' });
}

/** e.g. "Oct 1, 2026" */
export function formatDate(value: string): string {
  const date = parseDateKey(value);
  if (!date) return value;
  return date.toLocaleDateString(DATE_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRangeLabel(range: DateRange): string {
  if (range.from === range.to) return formatDate(range.from);
  return `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

/** e.g. "Oct 1, 2026, 2:05 PM" in the local timezone, for created/updated timestamps. */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(DATE_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
