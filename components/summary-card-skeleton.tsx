import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Skeleton } from '@/components/skeleton';
import { colors, design } from '@/constants/colors';

export function SummaryCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.summaryRow}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.itemWrapper}>
            {i > 0 && <View style={styles.summaryDivider} />}
            <View style={styles.summaryItem}>
              <Skeleton width={56} height={12} />
              <Skeleton width={64} height={20} />
            </View>
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
  itemWrapper: {
    flex: 1,
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
    marginRight: design.spacing.sm + 4,
  },
});
