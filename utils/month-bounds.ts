/**
 * First day of the month, and first day of the next one (December rolls the year over), as
 * `YYYY-MM-DD` for a 0-based month. `transactions.date` is a timestamptz, so a month is queried
 * as `date >= start AND date < nextStart`: a `<= last day` bound would be midnight UTC and drop
 * the whole last day.
 */
export function getMonthBounds(year: number, month: number): { start: string; nextStart: string } {
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return { start: key(year, month), nextStart: key(next.year, next.month) };
}
