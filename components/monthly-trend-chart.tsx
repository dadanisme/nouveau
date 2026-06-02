import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import type { MonthlyPoint } from '@/utils/analytics';

const CHART_HEIGHT = 120;
const MIN_BAR_HEIGHT = 3;

interface MonthlyTrendChartProps {
  data: MonthlyPoint[];
  /** Month index (0-11) to highlight, e.g. the current month when viewing the current year */
  highlightMonth?: number;
}

export function MonthlyTrendChart({ data, highlightMonth }: MonthlyTrendChartProps) {
  const { t } = useLanguage();
  const monthNames = t(k.datePicker.months, { returnObjects: true }) as unknown as string[];

  const maxExpense = Math.max(...data.map((point) => point.expense), 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 500 });
  }, [progress, data]);

  return (
    <Card style={styles.card}>
      <View style={styles.chartRow}>
        {data.map((point) => (
          <View key={point.month} style={styles.column}>
            <View style={styles.barArea}>
              <TrendBar
                ratio={point.expense / maxExpense}
                isHighlighted={point.month === highlightMonth}
                progress={progress}
              />
            </View>
            <Text
              style={[
                styles.monthLabel,
                point.month === highlightMonth && styles.monthLabelHighlighted,
              ]}
            >
              {monthNames[point.month]?.charAt(0)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function TrendBar({
  ratio,
  isHighlighted,
  progress,
}: {
  ratio: number;
  isHighlighted: boolean;
  progress: SharedValue<number>;
}) {
  const barStyle = useAnimatedStyle(() => ({
    height: Math.max(progress.value * ratio * CHART_HEIGHT, MIN_BAR_HEIGHT),
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { backgroundColor: isHighlighted ? colors.primary.DEFAULT : colors.expense },
        ratio === 0 && styles.barEmpty,
        barStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.md,
  },
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
  barEmpty: {
    backgroundColor: colors.gray[200],
  },
  monthLabel: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[400],
  },
  monthLabelHighlighted: {
    color: colors.gray[900],
    fontWeight: '800',
  },
});
