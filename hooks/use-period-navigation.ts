import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import {
  formatPeriodLabel,
  getPeriodMenuYears,
  isSamePeriod,
  shiftPeriod,
  type Period,
  type PeriodMenuYear,
  type PeriodMode,
} from '@/utils/date';

export interface PeriodNavigation {
  mode: PeriodMode;
  period: Period;
  /** "March 2026" (month mode) or "2026" (year mode). */
  label: string;
  /** "Mar 2026" (month mode) or "2026", for tight spots such as a crowded nav bar. */
  shortLabel: string;
  /** Whether the period contains today. */
  isCurrent: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  goTo: (period: Period) => void;
  goToCurrent: () => void;
  /** What the period menu offers, newest year first. */
  menuYears: PeriodMenuYear[];
}

function currentPeriod(): Period {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * The period a screen shows (a month, or a year in year mode) and how to move it: previous /
 * next, jump to a period, back to today. Starts on the current period, or `initial`. Pair it
 * with `usePeriodNavToolbar` for the native header controls.
 */
export function usePeriodNavigation(
  mode: PeriodMode = 'month',
  initial?: Period,
): PeriodNavigation {
  const [period, setPeriod] = useState<Period>(() => initial ?? currentPeriod());
  const today = currentPeriod();
  // The in-app language, so the labels follow it (they are memoized on their inputs).
  const { locale } = useLanguage();

  return {
    mode,
    period,
    label: formatPeriodLabel(mode, period.year, period.month, { locale }),
    shortLabel: formatPeriodLabel(mode, period.year, period.month, { short: true, locale }),
    isCurrent: isSamePeriod(mode, period, today),
    goToPrevious: () => setPeriod((current) => shiftPeriod(mode, current, -1)),
    goToNext: () => setPeriod((current) => shiftPeriod(mode, current, 1)),
    goTo: setPeriod,
    goToCurrent: () => setPeriod(currentPeriod()),
    menuYears: getPeriodMenuYears(mode, today, period),
  };
}
