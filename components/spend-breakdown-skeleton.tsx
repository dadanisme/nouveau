import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Skeleton } from '@/components/skeleton';
import { colors, design } from '@/constants/colors';

const BAR_HEIGHT = 14;
const DOT_SIZE = 8;
const LEGEND_ITEM_COUNT = 5;

export function SpendBreakdownSkeleton() {
  return (
    <Card style={styles.card}>
      {/* Income / Expense Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Skeleton width={70} height={12} />
          <Skeleton width={100} height={20} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Skeleton width={70} height={12} />
          <Skeleton width={100} height={20} />
        </View>
      </View>

      {/* Bar */}
      <View style={styles.barRow}>
        <Skeleton
          width={0}
          height={BAR_HEIGHT}
          borderRadius={design.radius.sm}
          style={styles.barFill}
        />
      </View>

      {/* Legend Dots */}
      <View style={styles.legend}>
        {Array.from({ length: LEGEND_ITEM_COUNT }).map((_, i) => (
          <View key={i} style={styles.legendItem}>
            <Skeleton width={DOT_SIZE} height={DOT_SIZE} borderRadius={DOT_SIZE / 2} />
            <Skeleton width={50 + ((i * 17) % 30)} height={12} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    gap: 6,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.gray[200],
    marginHorizontal: design.spacing.md,
  },
  barRow: {
    marginTop: design.spacing.md,
    marginBottom: design.spacing.md,
  },
  barFill: {
    flex: 1,
    width: '100%' as unknown as number,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: design.spacing.md,
    rowGap: design.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.xs + 2,
  },
});
