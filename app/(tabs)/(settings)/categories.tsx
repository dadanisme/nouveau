import { Stack } from 'expo-router';

import {
  FormEmptyRow,
  FormListRow,
  FormLoadingRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCategoryManagement, type CategoryListItem } from '@/hooks/use-category-management';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

const EMPTY_SYMBOL = { sf: 'square.grid.2x2', material: 'category' } as const;

/**
 * Categories, grouped by type in a native form. Tap a row to edit it in the category-form sheet;
 * swipe (iOS) or long-press (Android) to delete behind a confirmation; `+` adds one.
 */
export default function CategoriesScreen() {
  const { t } = useLanguage();
  const mgmt = useCategoryManagement();
  const addIcon = useSymbolIcon({ sf: 'plus', md: 'add' });

  const renderRows = (items: CategoryListItem[]) =>
    items.map(({ category, symbol }) => (
      <FormListRow
        key={category.id}
        title={category.name}
        symbol={symbol}
        onPress={() => mgmt.openEditForm(category)}
        onDelete={() => mgmt.requestDelete(category)}
        deleteLabel={t(k.common.delete)}
      />
    ));

  return (
    <>
      {addIcon ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={addIcon}
            accessibilityLabel={t(k.categories.newCategory)}
            onPress={mgmt.openAddForm}
          />
        </Stack.Toolbar>
      ) : null}

      {/* The form must be the screen's root view: the native header tracks its scroll. */}
      <NativeForm onRefresh={mgmt.refresh}>
        {mgmt.isLoading ? (
          <FormSection>
            <FormLoadingRow />
          </FormSection>
        ) : mgmt.isEmpty ? (
          <FormSection>
            <FormEmptyRow
              title={t(k.categories.noCategories)}
              description={t(k.categories.addFirst)}
              symbol={EMPTY_SYMBOL}
            />
          </FormSection>
        ) : (
          <>
            {mgmt.expenseCategories.length > 0 ? (
              <FormSection title={t(k.common.expense)}>
                {renderRows(mgmt.expenseCategories)}
              </FormSection>
            ) : null}
            {mgmt.incomeCategories.length > 0 ? (
              <FormSection title={t(k.common.income)}>
                {renderRows(mgmt.incomeCategories)}
              </FormSection>
            ) : null}
          </>
        )}
      </NativeForm>
    </>
  );
}
