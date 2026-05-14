import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FAB_HEIGHT, FloatingAddButton } from '@/components/floating-add-button';
import { SpendBreakdown } from '@/components/spend-breakdown';
import { SpendBreakdownSkeleton } from '@/components/spend-breakdown-skeleton';
import { TransactionGroupSkeleton } from '@/components/transaction-group-skeleton';
import { TransactionItem } from '@/components/transaction-item';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useProfileHeader } from '@/hooks/use-profile-header';
import {
  useTransactionsScreen,
  type FilterType,
  type TransactionGroup,
} from '@/hooks/use-transactions-screen';
import { k } from '@/locales/keys';
import { formatCompactAmount } from '@/utils/currency';
import { toTransactionItemData } from '@/utils/transaction';

const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 250;

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const { displayName, firstName, profileImage, greeting } = useProfileHeader();

  const {
    monthLabel,
    activeFilter,
    setActiveFilter,
    totals,
    expenseCategoryBreakdown,
    groupedTransactions,
    goToPreviousMonth,
    goToNextMonth,
    isLoading,
    isRefreshing,
    refetch,
  } = useTransactionsScreen();
  const { requestDelete, deleteConfirmAlert } = useDeleteConfirmation();

  const FILTERS: { key: FilterType; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t(k.transactions.all) },
      { key: 'income', label: t(k.transactions.income) },
      { key: 'expense', label: t(k.transactions.expense) },
    ],
    [t],
  );

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: FAB_HEIGHT + insets.bottom + design.spacing.lg },
          ]}
          stickyHeaderIndices={[1]}
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
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileLeft}>
              <Avatar uri={profileImage} name={displayName} size={48} />
              <View>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.name}>{firstName}</Text>
              </View>
            </View>
            <Button
              variant="outline"
              accessibilityLabel={t(k.settings.title)}
              accessibilityRole="button"
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={22} color={colors.gray[900]} />
            </Button>
          </View>

          {/* Sticky Month Nav — index 1 in stickyHeaderIndices below; keep position aligned */}
          <View style={styles.stickyMonthNavOuter}>
            <View style={styles.stickyMonthNavInner}>
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

          {/* Summary + Spend Breakdown */}
          {isLoading ? (
            <SpendBreakdownSkeleton />
          ) : (
            <SpendBreakdown
              income={totals.income}
              expense={totals.expense}
              categories={expenseCategoryBreakdown}
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

        <FloatingAddButton />

        {deleteConfirmAlert}
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: design.spacing.lg,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
  },
  greeting: {
    fontSize: design.fontSize.sm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  name: {
    fontSize: design.fontSize.xl,
    fontWeight: '800',
    color: colors.gray[900],
  },
  settingsButton: {
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  stickyMonthNavOuter: {
    backgroundColor: colors.background,
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.lg,
    marginHorizontal: -design.spacing.lg,
    marginBottom: design.spacing.md,
  },
  stickyMonthNavInner: {
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
