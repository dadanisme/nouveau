import { useMemo } from 'react';

import { useLanguage } from '@/contexts/language';
import type { MonthlyPoint } from '@/utils/analytics';
import { toMonthlyChartModel } from '@/utils/monthly-chart';

export interface MonthlySpendingChartProps {
  data: MonthlyPoint[];
  /** Month index (0-11) to highlight, e.g. the current month when viewing the current year */
  highlightMonth?: number;
}

/** The monthly spending chart's bars, ticks and descriptions, in the in-app language. */
export function useMonthlyChart({ data, highlightMonth }: MonthlySpendingChartProps) {
  const { locale } = useLanguage();
  return useMemo(
    () => toMonthlyChartModel(data, highlightMonth, locale),
    [data, highlightMonth, locale],
  );
}
