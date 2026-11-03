import { Stack } from 'expo-router';

import { FormLoadingRow, FormSection, NativeForm } from '@/components/native-form';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { TransactionRow } from '@/components/transaction-row';
import { useCategoryTransactionsSheet } from '@/hooks/use-category-transactions-sheet';

/**
 * Insights category drill-down sheet. Params: `categoryId`, `mode`, `year`, `month`.
 * A native form of the category's transactions in the period, named in the header with a leading
 * Close on iOS. Rows behave as on Transactions: a tap opens Edit Transaction and long-press offers
 * View Proofs / Delete (each opens after this sheet closes); iOS rows swipe to delete.
 */
export default function CategoryTransactionsSheet() {
  const sheet = useCategoryTransactionsSheet();

  return (
    <>
      <Stack.Screen options={{ title: sheet.categoryName }} />
      <SheetCloseToolbar onPress={sheet.close} />
      <NativeForm title={sheet.categoryName}>
        <FormSection title={sheet.periodLabel}>
          {sheet.isLoading ? (
            <FormLoadingRow />
          ) : (
            sheet.rows.map((row) => (
              <TransactionRow
                key={row.id}
                transaction={row}
                onPress={() => sheet.editTransaction(row.id)}
                onViewProofs={() => sheet.viewProofs(row.id)}
                onDelete={() => sheet.requestDelete(row.id)}
              />
            ))
          )}
        </FormSection>
      </NativeForm>
    </>
  );
}
