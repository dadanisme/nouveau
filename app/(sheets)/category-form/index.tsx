import { FormSaveToolbar } from '@/components/form-save-toolbar';
import {
  FormButtonRow,
  FormListRow,
  FormLoadingRow,
  FormSection,
  FormSegmentedRow,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { SheetCancelToolbar } from '@/components/sheet-toolbar';
import { SHEET_HAS_HEADER } from '@/constants/sheet-options';
import { useLanguage } from '@/contexts/language';
import { useCategoryForm } from '@/hooks/use-category-form';
import { k } from '@/locales/keys';

const NAME_MAX_LENGTH = 50;

/**
 * Add / edit category sheet. Param: `id` (edit). A native form: name, type, icon and color rows
 * (each pushes its picker inside the sheet on iOS, opens a picker sheet on Android), and delete
 * when editing. iOS commits from the header (Cancel / Save); Android's headerless sheet keeps a
 * Save row. Save is enabled once there's a name, Update once something changed.
 */
export default function CategoryFormSheet() {
  const { t } = useLanguage();
  const form = useCategoryForm();

  const typeOptions = [
    { value: 'expense', label: t(k.common.expense) },
    { value: 'income', label: t(k.common.income) },
  ] as const;

  const saveTitle = form.isEditing ? t(k.common.update) : t(k.common.save);

  return (
    <>
      {SHEET_HAS_HEADER ? (
        <>
          <SheetCancelToolbar onPress={form.cancel} />
          <FormSaveToolbar
            title={saveTitle}
            disabled={!form.canSave}
            pending={form.isSaving}
            onPress={form.handleSubmit}
          />
        </>
      ) : null}
      <NativeForm
        title={form.isEditing ? t(k.categories.editCategory) : t(k.categories.newCategory)}
      >
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
                value={form.iconLabelKey ? t(form.iconLabelKey) : undefined}
                onPress={form.openIconPicker}
              />
              <FormListRow
                title={t(k.categories.color)}
                swatch={form.colorSwatch}
                value={form.colorLabelKey ? t(form.colorLabelKey) : undefined}
                onPress={form.openColorPicker}
              />
            </FormSection>

            {SHEET_HAS_HEADER ? null : (
              <FormSection>
                <FormButtonRow
                  title={saveTitle}
                  emphasis="filled"
                  pending={form.isSaving}
                  disabled={!form.canSave}
                  onPress={form.handleSubmit}
                />
              </FormSection>
            )}

            {form.isEditing ? (
              <FormSection>
                <FormButtonRow
                  title={t(k.categories.deleteCategory)}
                  role="destructive"
                  pending={form.isDeleting}
                  disabled={form.isPending}
                  onPress={form.requestDelete}
                />
              </FormSection>
            ) : null}
          </>
        )}
      </NativeForm>
    </>
  );
}
