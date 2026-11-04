import { Stack } from 'expo-router';

import { ADD_FAB_CLEARANCE, AddTransactionFab } from '@/components/add-transaction-fab';
import {
  FormEmptyRow,
  FormLoadingRow,
  FormNavRow,
  FormProgressRow,
  FormSection,
  FormValueRow,
  NativeForm,
} from '@/components/native-form';
import { usePeriodNavToolbar } from '@/components/period-nav-toolbar';
import { TransactionRow } from '@/components/transaction-row';
import { TransactionsHeaderToolbar } from '@/components/transactions-header-toolbar';
import { useLanguage } from '@/contexts/language';
import { useTransactionsScreen } from '@/hooks/use-transactions-screen';
import { k } from '@/locales/keys';
import { getAddActionPlacement } from '@/utils/platform';

const ADD_ACTION_PLACEMENT = getAddActionPlacement();

const EMPTY_SYMBOL = { sf: 'list.bullet.rectangle', material: 'receipt_long' } as const;

/**
 * Transactions for a month in a native grouped list. The month is the nav title; chevrons and a
 * month menu in the header change it. A summary and spend breakdown come first, then one section
 * per day. Tap a row to edit it; long-press for Edit / View Proofs / Delete; swipe to delete (iOS).
 */
export default function TransactionsScreen() {
  const { t } = useLanguage();
  const screen = useTransactionsScreen();
  const periodToolbar = usePeriodNavToolbar(screen.nav);

  return (
    <>
      {/* The full month, as on Insights; the system truncates the inline title if it must. */}
      <Stack.Screen options={{ title: screen.nav.label }} />
      {periodToolbar.leftToolbar}
      <TransactionsHeaderToolbar
        leadingItems={periodToolbar.rightItems}
        showAddAction={ADD_ACTION_PLACEMENT === 'toolbar'}
        onAddPress={screen.addTransaction}
        activeFilter={screen.activeFilter}
        onFilterChange={screen.setActiveFilter}
        categoryFilter={screen.categoryFilter}
        onCategoryFilterChange={screen.setCategoryFilter}
        categoryGroups={screen.categoryGroups}
        isFilterActive={screen.isFilterActive}
      />

      {/* The form must be the screen's root view: the native header tracks its scroll. */}
      <NativeForm onRefresh={screen.refresh} bottomInset={ADD_FAB_CLEARANCE}>
        {screen.isLoading ? (
          <FormSection>
            <FormLoadingRow />
          </FormSection>
        ) : screen.isMonthEmpty ? (
          <FormSection>
            <FormEmptyRow title={t(k.transactions.noTransactions)} symbol={EMPTY_SYMBOL} />
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
              <FormNavRow title={t(k.insights.viewInsights)} onPress={screen.openInsights} />
            </FormSection>

            {screen.breakdown.length > 0 ? (
              <FormSection title={t(k.insights.spendingByCategory)}>
                {screen.breakdown.map(({ key, title, symbol, amount, share, categoryId }) => (
                  <FormProgressRow
                    key={key}
                    title={title}
                    symbol={symbol}
                    value={amount}
                    progress={share}
                    onPress={categoryId ? () => screen.openCategory(categoryId) : undefined}
                  />
                ))}
              </FormSection>
            ) : null}

            {screen.daySections.length === 0 ? (
              <FormSection>
                <FormEmptyRow title={t(k.transactions.noTransactions)} symbol={EMPTY_SYMBOL} />
              </FormSection>
            ) : (
              screen.daySections.map((day) => (
                <FormSection key={day.dateKey} title={day.title} footer={day.footer}>
                  {day.rows.map((row) => (
                    <TransactionRow
                      key={row.id}
                      transaction={row}
                      onPress={() => screen.editTransaction(row.id)}
                      onEdit={() => screen.editTransaction(row.id)}
                      onViewProofs={() => screen.viewProofs(row.id)}
                      onDelete={() => screen.requestDelete(row.id)}
                    />
                  ))}
                </FormSection>
              ))
            )}
          </>
        )}
      </NativeForm>

      {ADD_ACTION_PLACEMENT === 'fab' && <AddTransactionFab />}
    </>
  );
}
