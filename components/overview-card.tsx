import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';

interface OverviewCardProps {
  type: 'income' | 'expense';
  amount: number;
  change: number;
}

export function OverviewCard({ type, amount, change }: OverviewCardProps) {
  const isIncome = type === 'income';
  const accentColor = isIncome ? colors.income : colors.expense;
  const changePrefix = change > 0 ? '+' : '';
  const isPositiveChange = isIncome ? change > 0 : change < 0;
  const changeColor =
    change === 0 ? colors.gray[500] : isPositiveChange ? colors.income : colors.expense;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
        <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={18} color={accentColor} />
      </View>
      <Text style={styles.label}>{isIncome ? 'Income' : 'Expense'}</Text>
      <Text style={styles.amount}>
        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
      <Text style={[styles.change, { color: changeColor }]}>
        {changePrefix}
        {change}%
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: design.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: design.radius.sm,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
  },
  amount: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  change: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
  },
});
