import { PlatformColor } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';
import { useMonthlyChart, type MonthlySpendingChartProps } from '@/hooks/use-monthly-chart';
import { MonthlyBarChart } from '@/modules/native-charts';

// The bars take a system gray; only the current month takes the accent, so it means one thing.
const BAR_COLOR = PlatformColor('systemGray2');

/**
 * A year's spending per month as a Swift Charts bar chart (`modules/native-charts`), drawn as a
 * native `Form` row: place it directly in a `FormSection`.
 */
export function MonthlySpendingChart(props: MonthlySpendingChartProps) {
  const chart = useMonthlyChart(props);
  const isAccessibilitySize = useIsAccessibilityTextSize();
  return (
    <MonthlyBarChart
      {...chart}
      barColor={BAR_COLOR}
      highlightColor={ACCENT_COLOR}
      isAccessibilitySize={isAccessibilitySize}
    />
  );
}
