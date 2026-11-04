import { getDateLocale } from '@/lib/i18n';

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Format a Date as YYYY-MM-DD using local timezone (avoids UTC shift). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses a local `YYYY-MM-DD` string to a Date at local midnight; null when missing or malformed. */
export function parseLocalDateString(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The local calendar day as UTC midnight (ISO string), the form Compose date pickers take: they
 * select days as UTC-midnight timestamps.
 */
export function toUtcMidnightString(date: Date): string {
  return `${toLocalDateString(date)}T00:00:00Z`;
}

/** A Compose date picker's UTC-midnight selection as the same calendar day at local midnight. */
export function fromUtcMidnight(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric' });
}

/** "Mar 4, 2026" in the app locale. */
export function formatMediumDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(getDateLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** An Insights period: a single month, or a whole year. */
export type PeriodMode = 'month' | 'year';

/**
 * "March 2026" for a month period (month is 0-based), "2026" for a year period. `short` gives
 * "Mar 2026"; `locale` pins the app language (pass it where the result is memoized).
 */
export function formatPeriodLabel(
  mode: PeriodMode,
  year: number,
  month: number,
  { short = false, locale }: { short?: boolean; locale?: string } = {},
): string {
  if (mode === 'year') return String(year);
  return new Date(year, month).toLocaleDateString(getDateLocale(locale), {
    month: short ? 'short' : 'long',
    year: 'numeric',
  });
}

/** A month (0-based); in year mode only `year` counts. */
export interface Period {
  year: number;
  month: number;
}

/** The period `delta` steps from `period`: months in month mode, years in year mode. */
export function shiftPeriod(mode: PeriodMode, period: Period, delta: number): Period {
  if (mode === 'year') return { year: period.year + delta, month: period.month };
  const index = period.year * 12 + period.month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

/** Whether two periods are the same month (month mode) or year (year mode). */
export function isSamePeriod(mode: PeriodMode, a: Period, b: Period): boolean {
  return a.year === b.year && (mode === 'year' || a.month === b.month);
}

/** The localized month name ("March"), month 0-based; `locale` pins the app language. */
export function formatMonthName(month: number, locale?: string): string {
  return new Date(2000, month).toLocaleDateString(getDateLocale(locale), { month: 'long' });
}

/**
 * A day section heading for a local `YYYY-MM-DD` key: the given "Today" / "Yesterday" labels,
 * otherwise the weekday and date ("Monday, March 3").
 */
export function formatDayLabel(
  dateKey: string,
  now: Date,
  relative: { today: string; yesterday: string },
): string {
  const date = parseLocalDateString(dateKey);
  if (!date) return dateKey;
  if (isSameDay(date, now)) return relative.today;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, yesterday)) return relative.yesterday;
  return date.toLocaleDateString(getDateLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** How many years back the period menu offers (the chevrons go further). */
export const PERIOD_MENU_YEARS = 5;

/** A year in the period menu and, in month mode, the months it offers (0-based, ascending). */
export interface PeriodMenuYear {
  year: number;
  months: number[];
}

/**
 * The years (and months) the period menu offers: the last {@link PERIOD_MENU_YEARS} years up to today,
 * plus the viewed year when the chevrons went outside that range. Months run up to today's month
 * in the current year (all twelve in past years, up to the viewed month in a future year).
 */
export function getPeriodMenuYears(
  mode: PeriodMode,
  today: Period,
  viewed: Period,
): PeriodMenuYear[] {
  const years = new Set<number>();
  for (let offset = 0; offset < PERIOD_MENU_YEARS; offset++) years.add(today.year - offset);
  years.add(viewed.year);

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => {
      if (mode === 'year') return { year, months: [] };
      const lastMonth =
        year < today.year ? 11 : year === today.year ? today.month : Math.max(viewed.month, 0);
      return { year, months: Array.from({ length: lastMonth + 1 }, (_, month) => month) };
    });
}
