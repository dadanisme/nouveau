import { Stack } from 'expo-router';

import { ADD_FAB_CLEARANCE, AddTransactionFab } from '@/components/add-transaction-fab';
import { CategoryBar } from '@/components/category-bar';
import { FormEmptyRow, FormLoadingRow, FormSection, NativeForm } from '@/components/native-form';
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
 * month menu in the header change it. A storage-style bar of the month's spending by category comes
 * first (tap it for Insights), then one section per day. Tap a row to edit it; long-press for
 * Edit / View Proofs / Delete; swipe to delete (iOS).
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
            <FormEmptyRow
              title={t(k.transactions.noTransactions)}
              description={t(k.transactions.noTransactionsMessage)}
              symbol={EMPTY_SYMBOL}
            />
          </FormSection>
        ) : (
          <>
            {screen.categoryBar ? (
              <FormSection>
                <CategoryBar {...screen.categoryBar} onPress={screen.openInsights} />
              </FormSection>
            ) : null}

            {screen.daySections.length === 0 ? (
              <FormSection>
                <FormEmptyRow
                  title={t(k.transactions.noMatches)}
                  description={screen.noMatchesMessage}
                  symbol={EMPTY_SYMBOL}
                />
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
