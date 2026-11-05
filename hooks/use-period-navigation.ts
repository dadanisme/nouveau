import { AccessibilityInfo } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { usePeriod } from '@/contexts/period';
import {
  formatPeriodLabel,
  getPeriodMenuYears,
  isSamePeriod,
  shiftPeriod,
  withPeriodYear,
  type Period,
  type PeriodMenuYear,
  type PeriodMode,
} from '@/utils/date';

export interface PeriodNavigation {
  mode: PeriodMode;
  period: Period;
  /** "March 2026" (month mode) or "2026" (year mode). */
  label: string;
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
 * next, jump to a period, back to today. The period is the shared one from `PeriodProvider`, so
 * Transactions and Insights move together (#93). In year mode a change moves only the year and
 * keeps the month (clamped to today's, `withPeriodYear`), which Transactions shows next. Pair it
 * with `usePeriodNavToolbar` for the native header controls. Each change is announced to the
 * screen reader (the title and list change, but focus stays on the control that was used).
 */
export function usePeriodNavigation(mode: PeriodMode = 'month'): PeriodNavigation {
  const { period, setPeriod } = usePeriod();
  const today = currentPeriod();
  // The in-app language, so the labels follow it (they are memoized on their inputs).
  const { locale } = useLanguage();

  const changePeriod = (target: Period) => {
    const next = mode === 'year' ? withPeriodYear(period, target.year, today) : target;
    setPeriod(next);
    // Queued, so it follows whatever VoiceOver is saying about the control that was used.
    AccessibilityInfo.announceForAccessibilityWithOptions(
      formatPeriodLabel(mode, next.year, next.month, { locale }),
      { queue: true },
    );
  };

  return {
    mode,
    period,
    label: formatPeriodLabel(mode, period.year, period.month, { locale }),
    isCurrent: isSamePeriod(mode, period, today),
    goToPrevious: () => changePeriod(shiftPeriod(mode, period, -1)),
    goToNext: () => changePeriod(shiftPeriod(mode, period, 1)),
    goTo: changePeriod,
    goToCurrent: () => changePeriod(currentPeriod()),
    menuYears: getPeriodMenuYears(mode, today, period),
  };
}
