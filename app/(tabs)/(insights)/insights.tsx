import { Stack, useLocalSearchParams } from 'expo-router';

import { MonthlyTrendChart } from '@/components/monthly-trend-chart';
import {
  FormEmptyRow,
  FormHostedRow,
  FormLoadingRow,
  FormProgressRow,
  FormSection,
  FormSegmentedRow,
  FormValueRow,
  NativeForm,
} from '@/components/native-form';
import { usePeriodNavToolbar } from '@/components/period-nav-toolbar';
import { useLanguage } from '@/contexts/language';
import { useInsightsScreen, type InsightsMode } from '@/hooks/use-insights-screen';
import { k } from '@/locales/keys';
import { parseIntParam } from '@/utils/params';

const EMPTY_SYMBOL = { sf: 'chart.pie', material: 'pie_chart' } as const;

/**
 * Insights for a month or a year in a native grouped list. The period is the nav title; chevrons
 * and a period menu in the header change it (as on Transactions). A segmented control switches
 * month / year, then come the summary, the monthly trend (year mode) and spending by category;
 * tap a category for its transactions.
 */
export default function InsightsScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const screen = useInsightsScreen(parseIntParam(params.year), parseIntParam(params.month));
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
        <FormSection>
          <FormSegmentedRow<InsightsMode>
            label={t(k.insights.period)}
            options={modeOptions}
            selection={screen.mode}
            onSelectionChange={screen.setMode}
          />
        </FormSection>

        {screen.isLoading ? (
          <FormSection>
            <FormLoadingRow />
          </FormSection>
        ) : screen.isEmpty ? (
          <FormSection>
            <FormEmptyRow title={t(k.insights.noData)} symbol={EMPTY_SYMBOL} />
          </FormSection>
        ) : (
          <>
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
                {/* #37: legacy RN chart hosted in the form until Swift Charts / Compose replace it. */}
                <FormHostedRow>
                  <MonthlyTrendChart
                    data={screen.monthlyTrend}
                    highlightMonth={screen.highlightMonth}
                  />
                </FormHostedRow>
              </FormSection>
            ) : null}

            {screen.categoryRows.length > 0 ? (
              <FormSection title={t(k.insights.spendingByCategory)}>
                {screen.categoryRows.map(({ key, title, symbol, value, share, categoryId }) => (
                  <FormProgressRow
                    key={key}
                    title={title}
                    symbol={symbol}
                    value={value}
                    progress={share}
                    onPress={categoryId ? () => screen.openCategory(categoryId) : undefined}
                  />
                ))}
              </FormSection>
            ) : null}
          </>
        )}
      </NativeForm>
    </>
  );
}
