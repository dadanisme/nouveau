import { requireNativeView } from 'expo';
import type { ColorValue } from 'react-native';

/** A month's bar, with its strings already formatted (see `utils/monthly-chart.ts`). */
export type NativeMonthlyBar = {
  id: string;
  axisLabel: string;
  name: string;
  accessibilityLabel: string;
  value: number;
  valueLabel: string;
  isHighlighted: boolean;
};

export type NativeAxisTick = { value: number; label: string };

export type MonthlyBarChartProps = {
  bars: NativeMonthlyBar[];
  ticks: NativeAxisTick[];
  barColor?: ColorValue;
  highlightColor?: ColorValue;
  /** Audio Graphs title and summary, and the axis titles. */
  title: string;
  summary: string;
  xAxisTitle: string;
  yAxisTitle: string;
  /** At the accessibility text sizes the axes show fewer labels. */
  isAccessibilitySize?: boolean;
};

/**
 * The Swift Charts monthly bar chart (`ios/MonthlyBarChartView.swift`). A SwiftUI view: render it
 * inside an `@expo/ui` `Host` tree, e.g. as a `Form` section row. iOS only.
 */
export const MonthlyBarChart = requireNativeView<MonthlyBarChartProps>(
  'NativeCharts',
  'MonthlyBarChartView',
);

/** A category's segment of the bar, with its strings already formatted (see `utils/category-bar.ts`). */
export type NativeCategoryBarSegment = {
  id: string;
  name: string;
  value: number;
  shareLabel: string;
  color: ColorValue;
};

export type CategoryBarChartProps = {
  segments: NativeCategoryBarSegment[];
  /** What VoiceOver reads for the whole chart. */
  summary: string;
};

/**
 * The Swift Charts storage-style category bar with its legend (`ios/CategoryBarChartView.swift`).
 * A SwiftUI view: render it inside an `@expo/ui` `Host` tree, e.g. in a `Form` row. iOS only.
 */
export const CategoryBarChart = requireNativeView<CategoryBarChartProps>(
  'NativeCharts',
  'CategoryBarChartView',
);
