import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { CategoryBarList } from '@/components/category-bar-list';
import { CategoryPicker } from '@/components/category-picker';
import { MonthlyTrendChart } from '@/components/monthly-trend-chart';
import { SegmentedToggle } from '@/components/segmented-toggle';
import { SummaryCard } from '@/components/summary-card';
import { SummaryCardSkeleton } from '@/components/summary-card-skeleton';
import { TransactionItem } from '@/components/transaction-item';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useInsightsScreen, type InsightsMode } from '@/hooks/use-insights-screen';
import { k } from '@/locales/keys';
import { parseIntParam } from '@/utils/params';
import { toTransactionItemData } from '@/utils/transaction';

const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 250;

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const now = new Date();
  const initialYear = parseIntParam(params.year) ?? now.getFullYear();
  const initialMonth = parseIntParam(params.month) ?? now.getMonth();

  const {
    mode,
    setMode,
    periodLabel,
    totals,
    balance,
    categoryBreakdown,
    monthlyTrend,
    highlightMonth,
    selectedCategory,
    setSelectedCategory,
    selectedCategoryTransactions,
    recategorizeTarget,
    setRecategorizeTarget,
    recategorizeOptions,
    recategorize,
    goToPrevious,
    goToNext,
    isLoading,
    isRefreshing,
    refetch,
  } = useInsightsScreen(initialYear, initialMonth);
  const { requestDelete, deleteConfirmAlert } = useDeleteConfirmation();

  const modeOptions = [
    { value: 'month', label: t(k.insights.month) },
    { value: 'year', label: t(k.insights.year) },
  ] as const;

  function handleViewProofs(transactionId: string) {
    setSelectedCategory(null);
    router.push({ pathname: '/proof-viewer', params: { transactionId } });
  }

  const onSwipeNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToNext();
  }, [goToNext]);

  const onSwipePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToPrevious();
  }, [goToPrevious]);

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
        {/* Header — Back | Period Nav | Spacer (mirrors the transactions screen header) */}
        <View style={styles.header}>
          <Button variant="outline" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
          </Button>

          <View style={styles.periodNav}>
            <Pressable
              onPress={goToPrevious}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'month' ? t(k.transactions.previousMonth) : t(k.insights.previousYear)
              }
            >
              <Ionicons name="chevron-back" size={24} color={colors.gray[900]} />
            </Pressable>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <Pressable
              onPress={goToNext}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'month' ? t(k.transactions.nextMonth) : t(k.insights.nextYear)
              }
            >
              <Ionicons name="chevron-forward" size={24} color={colors.gray[900]} />
            </Pressable>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + design.spacing.lg },
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
          {/* Month / Year mode toggle */}
          <View style={styles.toggleContainer}>
            <SegmentedToggle<InsightsMode> options={modeOptions} value={mode} onChange={setMode} />
          </View>

          {isLoading ? (
            <SummaryCardSkeleton />
          ) : (
            <>
              <SummaryCard income={totals.income} expense={totals.expense} balance={balance} />

              {mode === 'year' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t(k.insights.monthlyTrend)}</Text>
                  <MonthlyTrendChart data={monthlyTrend} highlightMonth={highlightMonth} />
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(k.insights.spendingByCategory)}</Text>
                {categoryBreakdown.length > 0 ? (
                  <CategoryBarList
                    categories={categoryBreakdown}
                    onPressCategory={setSelectedCategory}
                  />
                ) : (
                  <View style={styles.centered}>
                    <Ionicons name="pie-chart-outline" size={48} color={colors.gray[300]} />
                    <Text style={styles.emptyText}>{t(k.insights.noData)}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Category transactions drill-down */}
        <BottomSheet
          visible={!!selectedCategory}
          onDismiss={() => setSelectedCategory(null)}
          snapPoints={['85%']}
        >
          <BottomSheetScrollView
            contentContainerStyle={[
              styles.categorySheet,
              { paddingBottom: insets.bottom + design.spacing.lg },
            ]}
          >
            <View style={styles.categorySheetHeader}>
              <View
                style={[styles.categorySheetSwatch, { backgroundColor: selectedCategory?.color }]}
              />
              <Text style={styles.categorySheetTitle}>{selectedCategory?.name}</Text>
              <Text style={styles.categorySheetPeriod}>{periodLabel}</Text>
            </View>
            {selectedCategoryTransactions.map((tx, index) => (
              <TransactionItem
                key={tx.id}
                transaction={toTransactionItemData(tx)}
                isLast={index === selectedCategoryTransactions.length - 1}
                onPress={() => setRecategorizeTarget(tx)}
                onViewProofs={() => handleViewProofs(tx.id)}
                onDelete={() => requestDelete(tx.id)}
                showEditMenuAction={false}
              />
            ))}
          </BottomSheetScrollView>
        </BottomSheet>

        {/* Quick re-categorize picker, stacked above the drill-down sheet */}
        <CategoryPicker
          visible={!!recategorizeTarget}
          categories={recategorizeOptions}
          selectedCategoryId={recategorizeTarget?.category.id ?? null}
          onSelect={recategorize}
          onDismiss={() => setRecategorizeTarget(null)}
          stackBehavior="push"
        />

        {deleteConfirmAlert}
      </View>
    </GestureDetector>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: design.spacing.sm,
    paddingHorizontal: design.spacing.lg,
    paddingVertical: design.spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  headerSpacer: {
    width: 44,
  },
  periodNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: design.spacing.md,
  },
  periodLabel: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  toggleContainer: {
    marginBottom: design.spacing.lg,
  },
  section: {
    marginBottom: design.spacing.lg,
  },
  sectionTitle: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[400],
    marginBottom: design.spacing.sm + 4,
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
  categorySheet: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.sm,
  },
  categorySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm,
    paddingVertical: design.spacing.sm,
    marginBottom: design.spacing.xs,
  },
  categorySheetSwatch: {
    width: 12,
    height: 12,
    borderRadius: design.radius.full,
  },
  categorySheetTitle: {
    flex: 1,
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  categorySheetPeriod: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
  },
});
