import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { colors, design } from '@/constants/colors';

interface CategorySpendingItemSkeletonProps {
  isLast?: boolean;
}

export function CategorySpendingItemSkeleton({ isLast }: CategorySpendingItemSkeletonProps) {
  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <Skeleton width={40} height={40} borderRadius={design.radius.sm} />
      <View style={styles.info}>
        <Skeleton width={100} height={16} />
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
    justifyContent: 'center',
  },
});
