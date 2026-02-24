import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TransactionGroupSkeleton } from '@/components/transaction-group-skeleton';
import { TransactionItem, type TransactionItemData } from '@/components/transaction-item';
import { colors, design } from '@/constants/colors';
import {
  useTransactionsScreen,
  type FilterType,
  type TransactionGroup,
} from '@/hooks/use-transactions-screen';
import type { TransactionWithCategory } from '@/hooks/use-transactions';
import { formatCompactAmount } from '@/utils/currency';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
];

function toItemData(tx: TransactionWithCategory): TransactionItemData {
  return {
    id: tx.id,
    description: tx.description,
    categoryName: tx.category.name,
    categoryColor: tx.category.color,
    categoryIcon: tx.category.icon,
    date: tx.date.split('T')[0],
    amount: tx.amount,
    type: tx.type as 'income' | 'expense',
  };
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    monthLabel,
    activeFilter,
    setActiveFilter,
    totals,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading,
  } = useTransactionsScreen();

  function handleTransactionPress(id: string) {
    router.push({ pathname: '/add-transaction', params: { id } });
  }

  function handleDatePress(dateKey: string) {
    router.push({ pathname: '/add-transaction', params: { date: dateKey } });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + design.spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Navigation Header */}
      <View style={styles.monthNav}>
        <Pressable onPress={goToPreviousMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gray[900]} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goToNextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={colors.gray[900]} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <Button
              key={filter.key}
              variant={isActive ? 'primary' : 'outline'}
              onPress={() => setActiveFilter(filter.key)}
              style={styles.filterTab}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {filter.label}
              </Text>
            </Button>
          );
        })}
      </View>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-down" size={14} color={colors.income} />
              <Text style={styles.summaryLabel}>Income</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              {formatCompactAmount(totals.income)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={styles.summaryLabelRow}>
              <Ionicons name="arrow-up" size={14} color={colors.expense} />
              <Text style={styles.summaryLabel}>Expense</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
              {formatCompactAmount(totals.expense)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <>
          <TransactionGroupSkeleton itemCount={3} />
          <TransactionGroupSkeleton itemCount={2} />
          <TransactionGroupSkeleton itemCount={2} />
        </>
      )}

      {/* Transaction Groups */}
      {!isLoading &&
        groupedTransactions.map((group) => (
          <DateGroup
            key={group.dateKey}
            group={group}
            onTransactionPress={handleTransactionPress}
            onDatePress={handleDatePress}
          />
        ))}

      {/* Empty State */}
      {!isLoading && groupedTransactions.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No transactions</Text>
        </View>
      )}
    </ScrollView>
  );
}

function DateGroup({
  group,
  onTransactionPress,
  onDatePress,
}: {
  group: TransactionGroup;
  onTransactionPress: (id: string) => void;
  onDatePress: (dateKey: string) => void;
}) {
  return (
    <View style={styles.dateGroup}>
      {/* Date Header */}
      <View style={styles.dateHeaderRow}>
        <Pressable onPress={() => onDatePress(group.dateKey)} hitSlop={8}>
          <Text style={styles.dateHeaderText}>{group.dateLabel}</Text>
        </Pressable>
        <View style={styles.dateHeaderLine} />
        <View style={styles.dateHeaderTotals}>
          {group.income > 0 && (
            <Text style={[styles.dateHeaderAmount, { color: colors.income }]}>
              +{formatCompactAmount(group.income)}
            </Text>
          )}
          {group.expense > 0 && (
            <Text style={[styles.dateHeaderAmount, { color: colors.expense }]}>
              -{formatCompactAmount(group.expense)}
            </Text>
          )}
        </View>
      </View>

      {/* Transaction Items */}
      <Card style={styles.groupCard}>
        {group.transactions.map((tx, index) => (
          <TransactionItem
            key={tx.id}
            transaction={toItemData(tx)}
            isLast={index === group.transactions.length - 1}
            showDate={false}
            onPress={() => onTransactionPress(tx.id)}
          />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: TAB_BAR_HEIGHT + design.spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: design.spacing.md,
    marginBottom: design.spacing.lg,
  },
  monthLabel: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  filterRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
    marginBottom: design.spacing.lg,
  },
  filterTab: {
    paddingHorizontal: design.spacing.md,
    paddingVertical: design.spacing.sm,
  },
  filterLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[500],
  },
  filterLabelActive: {
    color: colors.gray[900],
  },
  summaryCard: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
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
    fontSize: design.fontSize.lg,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray[200],
    marginHorizontal: design.spacing.md,
  },
  dateGroup: {
    marginBottom: design.spacing.md,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
    marginBottom: design.spacing.sm + 4,
  },
  dateHeaderText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[400],
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dateHeaderTotals: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  dateHeaderAmount: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
  },
  groupCard: {
    paddingVertical: design.spacing.xs,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.xl * 2,
    gap: design.spacing.sm + 4,
  },
  emptyText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[400],
  },
});
