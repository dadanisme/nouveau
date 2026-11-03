import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

import { CategoryBarList } from '@/components/category-bar-list';
import { MonthlyTrendChart } from '@/components/monthly-trend-chart';
import { SegmentedToggle } from '@/components/segmented-toggle';
import { SummaryCard } from '@/components/summary-card';
import { SummaryCardSkeleton } from '@/components/summary-card-skeleton';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useInsightsScreen, type InsightsMode } from '@/hooks/use-insights-screen';
import { k } from '@/locales/keys';
import { parseIntParam } from '@/utils/params';

const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 250;

export default function InsightsScreen() {
  const { t } = useLanguage();

  const params = useLocalSearchParams<{ year?: string; month?: string }>();

  const {
    mode,
    setMode,
    periodLabel,
    totals,
    balance,
    categoryBreakdown,
    monthlyTrend,
    highlightMonth,
    openCategory,
    goToPrevious,
    goToNext,
    isLoading,
    isRefreshing,
    refetch,
  } = useInsightsScreen(parseIntParam(params.year), parseIntParam(params.month));

  const modeOptions = [
    { value: 'month', label: t(k.insights.month) },
    { value: 'year', label: t(k.insights.year) },
  ] as const;

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
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.contentContainer}
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
          {/* Period nav (mirrors the transactions screen) */}
          <View style={styles.periodRow}>
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
          </View>

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
                  <CategoryBarList categories={categoryBreakdown} onPressCategory={openCategory} />
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
    paddingBottom: design.spacing.lg,
  },
  periodRow: {
    paddingVertical: design.spacing.sm,
    marginBottom: design.spacing.lg,
  },
  periodNav: {
    minHeight: 44,
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
});
