import { StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import type { Transaction } from '@/data/dummy';

interface TransactionItemProps {
  transaction: Transaction;
  isLast?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TransactionItem({ transaction, isLast }: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <View style={[styles.container, !isLast && styles.border]}>
      <View style={[styles.icon, { backgroundColor: transaction.categoryColor + '20' }]}>
        <View style={[styles.iconDot, { backgroundColor: transaction.categoryColor }]} />
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.meta}>
          {transaction.category} &middot; {formatDate(transaction.date)}
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
