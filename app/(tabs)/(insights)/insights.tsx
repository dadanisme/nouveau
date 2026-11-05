import { Stack } from 'expo-router';

import { MonthlySpendingChart } from '@/components/monthly-spending-chart';
import {
  FormEmptyRow,
  FormHeadlineRow,
  FormLoadingRow,
  FormProgressRow,
  FormSection,
  FormSegmentedSection,
  FormValueRow,
  NativeForm,
} from '@/components/native-form';
import { usePeriodNavToolbar } from '@/components/period-nav-toolbar';
import { useLanguage } from '@/contexts/language';
import {
  useInsightsScreen,
  type InsightsCategoryRow,
  type InsightsMode,
} from '@/hooks/use-insights-screen';
import { k } from '@/locales/keys';

const EMPTY_SYMBOL = { sf: 'chart.pie', material: 'pie_chart' } as const;

/**
 * Insights for a month or a year in a native grouped list. The period is the nav title; chevrons
 * and a period menu in the header change it (as on Transactions). A segmented control switches
 * month / year, then come the headline (the period's main message, against the previous period),
 * the summary, the monthly trend (year mode), and spending and income by category; tap a category
 * for its transactions.
 */
export default function InsightsScreen() {
  const { t } = useLanguage();
  const screen = useInsightsScreen();
  const periodToolbar = usePeriodNavToolbar(screen.nav);

  const modeOptions = [
    { value: 'month', label: t(k.insights.month) },
    { value: 'year', label: t(k.insights.year) },
  ] as const;

  return (
    <>
      <Stack.Screen options={{ title: screen.nav.label }} />
      {periodToolbar.leftToolbar}
      {periodToolbar.rightItems.length > 0 ? (
        <Stack.Toolbar placement="right">{periodToolbar.rightItems}</Stack.Toolbar>
      ) : null}

      {/* The form must be the screen's root view: the native header tracks its scroll. */}
      <NativeForm onRefresh={screen.refresh}>
        {/* A view switcher above the content, with no card (like Health's D/W/M). */}
        <FormSegmentedSection<InsightsMode>
          placement="plain"
          label={t(k.insights.period)}
          options={modeOptions}
          selection={screen.mode}
          onSelectionChange={screen.setMode}
        />

        {screen.isLoading ? (
          <FormSection>
            <FormLoadingRow />
          </FormSection>
        ) : screen.isEmpty ? (
          <FormSection>
            <FormEmptyRow
              title={t(k.insights.noData)}
              description={t(k.insights.noDataMessage)}
              symbol={EMPTY_SYMBOL}
            />
          </FormSection>
        ) : (
          <>
            <FormSection>
              <FormHeadlineRow
                title={screen.headline.headline}
                subtitle={screen.headline.detail}
                titleAccessibilityLabel={screen.headline.spokenHeadline}
                subtitleAccessibilityLabel={screen.headline.spokenDetail}
              />
            </FormSection>

            <FormSection title={t(k.transactions.summary)}>
              <FormValueRow
                title={t(k.transactions.income)}
                value={screen.summary.income}
                tone="positive"
              />
              <FormValueRow title={t(k.transactions.expense)} value={screen.summary.expense} />
              <FormValueRow
                title={t(k.insights.balance)}
                value={screen.summary.balance}
                emphasized
              />
            </FormSection>

            {screen.mode === 'year' ? (
              <FormSection title={t(k.insights.monthlyTrend)}>
                <MonthlySpendingChart
                  data={screen.monthlyTrend}
                  highlightMonth={screen.highlightMonth}
                />
              </FormSection>
            ) : null}

            <CategoryBreakdownSection
              title={t(k.insights.spendingByCategory)}
              rows={screen.spendingRows}
              onOpenCategory={screen.openCategory}
            />
            <CategoryBreakdownSection
              title={t(k.insights.incomeByCategory)}
              rows={screen.incomeRows}
              onOpenCategory={screen.openCategory}
            />
          </>
        )}
      </NativeForm>
    </>
  );
}

/** A breakdown by category, one progress row each; hidden when it has no rows. */
function CategoryBreakdownSection({
  title,
  rows,
  onOpenCategory,
}: {
  title: string;
  rows: InsightsCategoryRow[];
  onOpenCategory: (categoryId: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <FormSection title={title}>
      {rows.map(({ key, title: rowTitle, symbol, value, share, categoryId }) => (
        <FormProgressRow
          key={key}
          title={rowTitle}
          symbol={symbol}
          value={value}
          progress={share}
          onPress={categoryId ? () => onOpenCategory(categoryId) : undefined}
        />
      ))}
    </FormSection>
  );
}
