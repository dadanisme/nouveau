import {
  FormButtonRow,
  FormListRow,
  FormLoadingRow,
  FormSection,
  FormSegmentedRow,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCategoryForm } from '@/hooks/use-category-form';
import { k } from '@/locales/keys';

const NAME_MAX_LENGTH = 50;

/**
 * Add / edit category sheet. Param: `id` (edit). A native form: name, type, icon and color rows
 * (each opens its picker sheet over this one), save, and delete when editing.
 */
export default function CategoryFormSheet() {
  const { t } = useLanguage();
  const form = useCategoryForm();

  const typeOptions = [
    { value: 'expense', label: t(k.common.expense) },
    { value: 'income', label: t(k.common.income) },
  ] as const;

  return (
    <NativeForm title={form.isEditing ? t(k.categories.editCategory) : t(k.categories.newCategory)}>
      {form.isLoading ? (
        <FormSection>
          <FormLoadingRow />
        </FormSection>
      ) : (
        <>
          <FormSection>
            <FormTextFieldRow
              placeholder={t(k.categories.categoryName)}
              defaultValue={form.name}
              onChangeText={form.setName}
              autoFocus={!form.isEditing}
              maxLength={NAME_MAX_LENGTH}
            />
          </FormSection>

          <FormSection>
            <FormSegmentedRow
              label={t(k.transactions.type)}
              options={typeOptions}
              selection={form.type}
              onSelectionChange={form.setType}
            />
          </FormSection>

          <FormSection>
            <FormListRow
              title={t(k.categories.icon)}
              symbol={form.iconSymbol}
              onPress={form.openIconPicker}
            />
            <FormListRow
              title={t(k.categories.color)}
              symbol={form.colorSymbol}
              value={form.colorLabelKey ? t(form.colorLabelKey) : undefined}
              onPress={form.openColorPicker}
            />
          </FormSection>

          <FormSection>
            <FormButtonRow
              title={form.isEditing ? t(k.common.update) : t(k.common.save)}
              disabled={form.isPending}
              onPress={form.handleSubmit}
            />
          </FormSection>

          {form.isEditing ? (
            <FormSection>
              <FormButtonRow
                title={t(k.categories.deleteCategory)}
                role="destructive"
                disabled={form.isPending}
                onPress={form.requestDelete}
              />
            </FormSection>
          ) : null}
        </>
      )}
    </NativeForm>
  );
}
