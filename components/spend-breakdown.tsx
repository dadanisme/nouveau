import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import type { CategorySpend } from '@/hooks/use-transactions-screen';
import { k } from '@/locales/keys';
import { formatCompactAmount } from '@/utils/currency';

const BAR_HEIGHT = 14;
const BAR_GAP = 3;

interface SpendBreakdownProps {
  income: number;
  expense: number;
  categories: CategorySpend[];
}

export function SpendBreakdown({ income, expense, categories }: SpendBreakdownProps) {
  const { t } = useLanguage();

  const hasBreakdown = categories.length > 0;

  return (
    <Card style={styles.card}>
      {/* Income / Expense Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryLabelRow}>
            <Ionicons name="arrow-down" size={14} color={colors.income} />
            <Text style={styles.summaryLabel}>{t(k.transactions.income)}</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.income }]}>
            {formatCompactAmount(income)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryLabelRow}>
            <Ionicons name="arrow-up" size={14} color={colors.expense} />
            <Text style={styles.summaryLabel}>{t(k.transactions.expense)}</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.expense }]}>
            {formatCompactAmount(expense)}
          </Text>
        </View>
      </View>

      {/* Spend Breakdown */}
      {hasBreakdown && (
        <>
          {/* Stacked Bar */}
          <View style={styles.barContainer}>
            {categories.map((cat, index) => (
              <View
                key={cat.name}
                style={[
                  styles.barSegment,
                  {
                    flex: cat.percentage,
                    backgroundColor: cat.color,
                    borderTopLeftRadius: index === 0 ? design.radius.sm : 0,
                    borderBottomLeftRadius: index === 0 ? design.radius.sm : 0,
                    borderTopRightRadius: index === categories.length - 1 ? design.radius.sm : 0,
                    borderBottomRightRadius: index === categories.length - 1 ? design.radius.sm : 0,
                    marginLeft: index === 0 ? 0 : BAR_GAP,
                  },
                ]}
              />
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {categories.map((cat) => (
              <View key={cat.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
  },
  // Income / Expense summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  summaryAmount: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray[200],
    marginHorizontal: design.spacing.md,
  },
  // Spend breakdown
  barContainer: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    marginTop: design.spacing.md,
    marginBottom: design.spacing.md,
  },
  barSegment: {
    height: BAR_HEIGHT,
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
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[600],
  },
});
