import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import { formatCompactAmount, formatSignedCompactAmount } from '@/utils/currency';

interface SummaryCardProps {
  income: number;
  expense: number;
  balance: number;
  onPress?: () => void;
}

export function SummaryCard({ income, expense, balance, onPress }: SummaryCardProps) {
  const { t } = useLanguage();
  const balanceColor = balance >= 0 ? colors.income : colors.expense;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={t(k.insights.viewInsights)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.gray[400]}
            style={styles.chevron}
          />
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-down" size={14} color={colors.income} />
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {t(k.transactions.income)}
              </Text>
            </View>
            <Text
              style={[styles.summaryAmount, { color: colors.income }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatCompactAmount(income)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-up" size={14} color={colors.expense} />
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {t(k.transactions.expense)}
              </Text>
            </View>
            <Text
              style={[styles.summaryAmount, { color: colors.expense }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatCompactAmount(expense)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="wallet-outline" size={14} color={balanceColor} />
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {t(k.insights.balance)}
              </Text>
            </View>
            <Text
              style={[styles.summaryAmount, { color: balanceColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatSignedCompactAmount(balance)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  card: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.md,
  },
  chevron: {
    position: 'absolute',
    top: design.spacing.sm + 2,
    right: design.spacing.sm + 2,
  },
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
    fontSize: design.fontSize.sm,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray[200],
    marginHorizontal: design.spacing.sm,
  },
});
