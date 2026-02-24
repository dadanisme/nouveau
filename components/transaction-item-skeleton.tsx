import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { colors, design } from '@/constants/colors';

interface TransactionItemSkeletonProps {
  isLast?: boolean;
}

export function TransactionItemSkeleton({ isLast }: TransactionItemSkeletonProps) {
  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <Skeleton width={40} height={40} borderRadius={design.radius.sm} />
      <View style={styles.info}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} />
      </View>
      <Skeleton width={60} height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.sm + 4,
    gap: design.spacing.sm + 4,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
