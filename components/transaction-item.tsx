import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import { formatShortDate } from '@/utils/date';
import { parseIcon } from '@/utils/icon';

export interface TransactionItemData {
  id: string;
  description: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

interface TransactionItemProps {
  transaction: TransactionItemData;
  isLast?: boolean;
  showDate?: boolean;
}

export function TransactionItem({ transaction, isLast, showDate = true }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? '+' : '-';
  const icon = transaction.categoryIcon ? parseIcon(transaction.categoryIcon) : null;

  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <View style={[styles.icon, { backgroundColor: transaction.categoryColor + '20' }]}>
        {icon ? (
          <Ionicons
            name={icon.name as React.ComponentProps<typeof Ionicons>['name']}
            size={18}
            color={transaction.categoryColor}
          />
        ) : (
          <View style={[styles.iconDot, { backgroundColor: transaction.categoryColor }]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description ?? transaction.categoryName}
        </Text>
        <Text style={styles.meta}>
          {transaction.categoryName}
          {showDate ? ` \u00B7 ${formatShortDate(transaction.date)}` : ''}
        </Text>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}$
        {transaction.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        })}
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
    gap: 2,
  },
  description: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  meta: {
    fontSize: design.fontSize.xs,
    color: colors.gray[400],
    fontWeight: '500',
  },
  amount: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
  },
});
