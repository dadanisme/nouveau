import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { Card } from '@/components/card';
import { ADD_FAB_CLEARANCE, AddTransactionFab } from '@/components/add-transaction-fab';
import { SummaryCard } from '@/components/summary-card';
import { SummaryCardSkeleton } from '@/components/summary-card-skeleton';
import { TransactionGroupSkeleton } from '@/components/transaction-group-skeleton';
import { TransactionItem } from '@/components/transaction-item';
import { TransactionsHeaderToolbar } from '@/components/transactions-header-toolbar';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useTransactionsScreen, type TransactionGroup } from '@/hooks/use-transactions-screen';
import { k } from '@/locales/keys';
import { formatCompactAmount } from '@/utils/currency';
import { getAddActionPlacement } from '@/utils/platform';
import { toTransactionItemData } from '@/utils/transaction';

const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 250;
const ADD_ACTION_PLACEMENT = getAddActionPlacement();

export default function TransactionsScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const {
    view,
    monthLabel,
    activeFilter,
    setActiveFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    isFilterActive,
    totals,
    balance,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading,
    isRefreshing,
    refetch,
  } = useTransactionsScreen();
  const { requestDelete } = useDeleteConfirmation();

  function handleAddPress() {
    router.push('/add-transaction');
  }

  function handleTransactionPress(id: string) {
    router.push({ pathname: '/add-transaction', params: { id } });
  }

  function handleDatePress(dateKey: string) {
    router.push({ pathname: '/add-transaction', params: { date: dateKey } });
  }

  function handleViewProofs(transactionId: string) {
    router.push({ pathname: '/proof-viewer', params: { transactionId } });
  }

  const onSwipeNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToNextMonth();
  }, [goToNextMonth]);

  const onSwipePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToPreviousMonth();
  }, [goToPreviousMonth]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
          'worklet';
          const distance = e.translationX;
          const velocity = e.velocityX;
          if (
            distance < -SWIPE_DISTANCE_THRESHOLD ||
            (distance < 0 && velocity < -SWIPE_VELOCITY_THRESHOLD)
          ) {
            scheduleOnRN(onSwipeNext);
          } else if (
            distance > SWIPE_DISTANCE_THRESHOLD ||
            (distance > 0 && velocity > SWIPE_VELOCITY_THRESHOLD)
          ) {
            scheduleOnRN(onSwipePrev);
          }
        }),
    [onSwipeNext, onSwipePrev],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <TransactionsHeaderToolbar
          showAddAction={ADD_ACTION_PLACEMENT === 'toolbar'}
          onAddPress={handleAddPress}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          isFilterActive={isFilterActive}
        />
        <ScrollView
          style={styles.scroll}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.contentContainer,
            // The tab bar inset comes from contentInsetAdjustmentBehavior (iOS) and the
            // native tabs' bottom safe area (Android); this only clears the Android FAB.
            { paddingBottom: ADD_FAB_CLEARANCE + design.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
        >
          {/* Month Nav */}
          <View style={styles.navRowOuter}>
            <View style={styles.monthNav}>
              <Pressable
                onPress={goToPreviousMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t(k.transactions.previousMonth)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.gray[900]} />
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable
                onPress={goToNextMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t(k.transactions.nextMonth)}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.gray[900]} />
              </Pressable>
            </View>
          </View>

          {/* Income / Expense / Balance summary */}
          {isLoading ? (
            <SummaryCardSkeleton />
          ) : (
            <SummaryCard
              income={totals.income}
              expense={totals.expense}
              balance={balance}
              onPress={() =>
                router.navigate({
                  pathname: '/insights',
                  params: { year: String(view.year), month: String(view.month) },
                })
              }
            />
          )}

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
                onViewProofs={handleViewProofs}
                onDelete={requestDelete}
              />
            ))}

          {/* Empty State */}
          {!isLoading && groupedTransactions.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name="receipt-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>{t(k.transactions.noTransactions)}</Text>
            </View>
          )}
        </ScrollView>

        {ADD_ACTION_PLACEMENT === 'fab' && <AddTransactionFab />}
      </View>
    </GestureDetector>
  );
}

function DateGroup({
  group,
  onTransactionPress,
  onDatePress,
  onViewProofs,
  onDelete,
}: {
  group: TransactionGroup;
  onTransactionPress: (id: string) => void;
  onDatePress: (dateKey: string) => void;
  onViewProofs: (id: string) => void;
  onDelete: (id: string) => void;
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
            transaction={toTransactionItemData(tx)}
            isLast={index === group.transactions.length - 1}
            showDate={false}
            onPress={() => onTransactionPress(tx.id)}
            onViewProofs={() => onViewProofs(tx.id)}
            onDelete={() => onDelete(tx.id)}
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
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
  },
  navRowOuter: {
    paddingVertical: design.spacing.sm,
    marginBottom: design.spacing.lg,
  },
  monthNav: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: design.spacing.md,
  },
  monthLabel: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
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
