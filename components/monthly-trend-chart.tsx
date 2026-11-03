import { useEffect } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ACCENT_COLOR } from '@/constants/accent';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useSystemColors } from '@/hooks/use-system-colors';
import { k } from '@/locales/keys';
import type { MonthlyPoint } from '@/utils/analytics';

// #37: a stopgap until Swift Charts / Compose replace this chart. It sits in a native form row
// (`FormHostedRow`), which supplies the background, so it only takes system label/fill colors.

const CHART_HEIGHT = 120;
const MIN_BAR_HEIGHT = 3;

interface MonthlyTrendChartProps {
  data: MonthlyPoint[];
  /** Month index (0-11) to highlight, e.g. the current month when viewing the current year */
  highlightMonth?: number;
}

export function MonthlyTrendChart({ data, highlightMonth }: MonthlyTrendChartProps) {
  const { t } = useLanguage();
  const system = useSystemColors();
  const monthNames = t(k.datePicker.months, { returnObjects: true }) as unknown as string[];

  const maxExpense = Math.max(...data.map((point) => point.expense), 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 500 });
  }, [progress, data]);

  return (
    <View style={styles.chartRow}>
      {data.map((point) => (
        <View key={point.month} style={styles.column}>
          <View style={styles.barArea}>
            <TrendBar
              ratio={point.expense / maxExpense}
              isHighlighted={point.month === highlightMonth}
              emptyColor={system.fill}
              progress={progress}
            />
          </View>
          <Text
            style={[
              styles.monthLabel,
              { color: system.secondaryLabel },
              point.month === highlightMonth && [
                styles.monthLabelHighlighted,
                { color: system.label },
              ],
            ]}
          >
            {monthNames[point.month]?.charAt(0)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TrendBar({
  ratio,
  isHighlighted,
  emptyColor,
  progress,
}: {
  ratio: number;
  isHighlighted: boolean;
  emptyColor: ColorValue;
  progress: SharedValue<number>;
}) {
  const barStyle = useAnimatedStyle(() => ({
    height: Math.max(progress.value * ratio * CHART_HEIGHT, MIN_BAR_HEIGHT),
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: isHighlighted ? ACCENT_COLOR : colors.expense },
        ratio === 0 && { backgroundColor: emptyColor },
        barStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    gap: design.spacing.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: design.spacing.xs,
  },
  barArea: {
    height: CHART_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: design.radius.sm / 2,
    borderTopRightRadius: design.radius.sm / 2,
  },
  monthLabel: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
  },
  monthLabelHighlighted: {
    fontWeight: '800',
  },
});
