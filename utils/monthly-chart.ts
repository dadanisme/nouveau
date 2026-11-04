import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { MonthlyPoint } from '@/utils/analytics';
import { formatCompactAmount, formatCurrency } from '@/utils/currency';
import { formatMonthName } from '@/utils/date';

/** A month's bar in the monthly spending chart, with every string it shows or speaks. */
export interface MonthlyChartBar {
  /** A unique key per month (its 0-based index). */
  id: string;
  month: number;
  /** The month's initial, under the bar ("J"). */
  axisLabel: string;
  /** The full month name ("January"). */
  name: string;
  /** What a screen reader says for the bar: the month, plus "This Month" when highlighted. */
  accessibilityLabel: string;
  /** The month's expense total. */
  value: number;
  /** The full amount ("Rp1.500.000"), no abbreviations. */
  valueLabel: string;
  isHighlighted: boolean;
}

/** A y-axis tick and its compact label ("Rp500K"). */
export interface MonthlyChartTick {
  value: number;
  label: string;
}

export interface MonthlyChartModel {
  bars: MonthlyChartBar[];
  /** Ticks from zero up to the axis' upper bound, which is the last one. */
  ticks: MonthlyChartTick[];
  /** A one-line summary: the year's total and its highest month. */
  summary: string;
  title: string;
  xAxisTitle: string;
  yAxisTitle: string;
}

/**
 * Evenly spaced ticks from zero that cover `max` in at most three steps of a familiar size
 * (1, 2, 2.5 or 5 times a power of ten), e.g. 1.3M gives 0, 500K, 1M, 1.5M.
 */
export function niceAxisTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const steps = Math.ceil(max / step);
  return Array.from({ length: steps + 1 }, (_, i) => i * step);
}

/**
 * The monthly spending chart's bars, axis ticks and descriptions for a year of `data`. Only the
 * `highlightMonth` (the current month) is marked. `locale` pins the strings to the in-app language.
 */
export function toMonthlyChartModel(
  data: MonthlyPoint[],
  highlightMonth: number | undefined,
  locale?: string,
): MonthlyChartModel {
  const options = locale ? { locale } : undefined;
  const thisMonth = i18n.t(k.periodNav.thisMonth, options);

  const bars = data.map((point): MonthlyChartBar => {
    const name = formatMonthName(point.month, locale);
    const isHighlighted = point.month === highlightMonth;
    return {
      id: String(point.month),
      month: point.month,
      axisLabel: name.charAt(0).toLocaleUpperCase(),
      name,
      accessibilityLabel: isHighlighted ? `${name}, ${thisMonth}` : name,
      value: point.expense,
      valueLabel: formatCurrency(point.expense),
      isHighlighted,
    };
  });

  const max = Math.max(0, ...bars.map((bar) => bar.value));
  const ticks = niceAxisTicks(max).map((value) => ({
    value,
    label: formatCompactAmount(value, locale),
  }));

  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const highest = bars.reduce<MonthlyChartBar | undefined>(
    (top, bar) => (bar.value > (top?.value ?? 0) ? bar : top),
    undefined,
  );
  const summary = [
    i18n.t(k.insights.chartTotal, { ...options, amount: formatCurrency(total) }),
    highest
      ? i18n.t(k.insights.chartHighest, {
          ...options,
          month: highest.name,
          amount: highest.valueLabel,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    bars,
    ticks,
    summary,
    title: i18n.t(k.insights.monthlyTrend, options),
    xAxisTitle: i18n.t(k.insights.month, options),
    yAxisTitle: i18n.t(k.transactions.expense, options),
  };
}
