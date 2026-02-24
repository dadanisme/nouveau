import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Skeleton } from '@/components/skeleton';
import { TransactionItemSkeleton } from '@/components/transaction-item-skeleton';
import { colors, design } from '@/constants/colors';

interface TransactionGroupSkeletonProps {
  itemCount?: number;
}

export function TransactionGroupSkeleton({ itemCount = 3 }: TransactionGroupSkeletonProps) {
  return (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeaderRow}>
        <Skeleton width={80} height={14} />
        <View style={styles.dateHeaderLine} />
        <Skeleton width={50} height={12} />
      </View>
      <Card style={styles.groupCard}>
        {Array.from({ length: itemCount }, (_, i) => (
          <TransactionItemSkeleton key={i} isLast={i === itemCount - 1} />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  dateGroup: {
    marginBottom: design.spacing.md,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
    marginBottom: design.spacing.sm + 4,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  groupCard: {
    paddingVertical: design.spacing.xs,
  },
});
