import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import type { HomeCategorySpend } from '@/hooks/use-category-spending';
import { formatCompactAmount } from '@/utils/currency';
import { parseIcon } from '@/utils/icon';

interface CategorySpendingItemProps {
  item: HomeCategorySpend;
  isLast?: boolean;
  balanceHidden: boolean;
}

export function CategorySpendingItem({ item, isLast, balanceHidden }: CategorySpendingItemProps) {
  const icon = item.icon ? parseIcon(item.icon) : null;

  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <View style={[styles.icon, { backgroundColor: item.color + '20' }]}>
        {icon ? (
          <Ionicons
            name={icon.name as React.ComponentProps<typeof Ionicons>['name']}
            size={18}
            color={item.color}
          />
        ) : (
          <View style={[styles.iconDot, { backgroundColor: item.color }]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      <Text style={styles.amount}>
        {balanceHidden ? '••••••' : formatCompactAmount(item.amount)}
      </Text>
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: design.radius.sm,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  amount: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.expense,
  },
});
