import { useLocalSearchParams } from 'expo-router';

import { AmountFieldRow } from '@/components/amount-field-row';
import { DateFieldRow } from '@/components/date-field-row';
import {
  FormButtonRow,
  FormListRow,
  FormLoadingRow,
  FormNavRow,
  FormSection,
  FormSegmentedRow,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { TransactionFormToolbar } from '@/components/transaction-form-toolbar';
import { useLanguage } from '@/contexts/language';
import { useTransactionForm } from '@/hooks/use-transaction-form';
import { k } from '@/locales/keys';

const NOTE_MAX_LENGTH = 100;

/**
 * Add / edit transaction (`?id=` edits, `?date=` presets the date), presented as a form sheet on
 * iOS and a full-screen modal on Android (see the root layout). A native form: a large amount
 * field with the decimal keyboard, the type, the category (opens the category picker sheet), the
 * date, a note, and View Proofs (edit) or Save and Add Another (add). Save sits in the header.
 */
export default function AddTransactionScreen() {
  const { id, date: dateParam } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { t } = useLanguage();
  const form = useTransactionForm(id, dateParam);

  const typeOptions = [
    { value: 'expense', label: t(k.addTransaction.expense) },
    { value: 'income', label: t(k.addTransaction.income) },
  ] as const;

  return (
    <>
      <TransactionFormToolbar
        isEditMode={form.isEditMode}
        isSaving={form.isPending}
        isSaveDisabled={form.isSubmitDisabled}
        onSave={() => form.handleSubmit('save')}
        onViewProofs={form.openProofs}
        onDelete={form.confirmDelete}
      />

      {/* The form must be the screen's root view: the native header tracks its scroll. */}
      {/* The decimal pad has no return key: dragging the form dismisses it. */}
      <NativeForm dismissesKeyboardOnScroll>
        {form.isLoadingForm ? (
          <FormSection>
            <FormLoadingRow />
          </FormSection>
        ) : (
          <>
            <FormSection>
              {/* The amount field reads its value on mount; `fieldsKey` remounts it when the
                  form sets it (edit prefill, Save and Add Another). */}
              <AmountFieldRow
                key={`amount-${form.fieldsKey}`}
                label={t(k.addTransaction.amount)}
                prefix={form.amountPrefix}
                defaultAmount={form.amountString}
                decimals={form.amountDecimals}
                separators={form.amountSeparators}
                autoFocus={!form.isEditMode}
                onChangeAmount={form.setAmountString}
              />
            </FormSection>

            <FormSection>
              <FormSegmentedRow
                label={t(k.transactions.type)}
                options={typeOptions}
                selection={form.type}
                onSelectionChange={form.handleTypeChange}
              />
            </FormSection>

            <FormSection title={t(k.addTransaction.category)}>
              <FormListRow
                title={form.selectedCategory?.name ?? t(k.categoryPicker.title)}
                symbol={form.categorySymbol}
                onPress={form.openCategoryPicker}
              />
            </FormSection>

            <FormSection>
              <DateFieldRow
                title={t(k.addTransaction.date)}
                value={form.date}
                onChange={form.setDate}
              />
              <FormTextFieldRow
                placeholder={t(k.addTransaction.addNote)}
                value={form.description}
                onChangeText={form.setDescription}
                maxLength={NOTE_MAX_LENGTH}
              />
            </FormSection>

            {form.isEditMode ? (
              <FormSection>
                <FormNavRow title={t(k.addTransaction.viewProofs)} onPress={form.openProofs} />
              </FormSection>
            ) : (
              <FormSection>
                <FormButtonRow
                  title={t(k.addTransaction.addMore)}
                  disabled={form.isSubmitDisabled}
                  onPress={() => form.handleSubmit('add-more')}
                />
              </FormSection>
            )}
          </>
        )}
      </NativeForm>
    </>
  );
}
