import { FormLoadingRow, FormSection, NativeForm } from '@/components/native-form';
import { TransactionRow } from '@/components/transaction-row';
import { useLanguage } from '@/contexts/language';
import { useCategoryTransactionsSheet } from '@/hooks/use-category-transactions-sheet';
import { k } from '@/locales/keys';

/**
 * Insights category drill-down sheet. Params: `categoryId`, `mode`, `year`, `month`.
 * A native form of the category's transactions in the period: tapping a row opens the category
 * picker over this sheet to recategorize it; long-press offers View Proofs / Delete, and iOS rows
 * swipe to delete.
 */
export default function CategoryTransactionsSheet() {
  const { t } = useLanguage();
  const sheet = useCategoryTransactionsSheet();

  return (
    <NativeForm title={sheet.categoryName}>
      <FormSection title={sheet.periodLabel} footer={t(k.insights.recategorizeHint)}>
        {sheet.isLoading ? (
          <FormLoadingRow />
        ) : (
          sheet.rows.map((row) => (
            <TransactionRow
              key={row.id}
              transaction={row}
              onPress={() => sheet.recategorize(row.id)}
              onViewProofs={() => sheet.viewProofs(row.id)}
              onDelete={() => sheet.requestDelete(row.id)}
            />
          ))
        )}
      </FormSection>
    </NativeForm>
  );
}
