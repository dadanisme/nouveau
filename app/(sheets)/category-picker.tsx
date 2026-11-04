import {
  FormEmptyRow,
  FormListRow,
  FormLoadingRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCategoryPickerSheet } from '@/hooks/use-category-picker-sheet';
import { k } from '@/locales/keys';

const EMPTY_SYMBOL = { sf: 'square.grid.2x2', material: 'category' } as const;

/**
 * Category picker sheet. Params: `type` (only that type), `currentType` (all types, that one
 * first), `selectedId`, `requestId`; result: `category-picker`. A native single-choice list with
 * a section per type: each category's mapped symbol in its color, a checkmark on the selection.
 */
export default function CategoryPickerSheet() {
  const { t } = useLanguage();
  const { groups, isLoading, isEmpty, selectedCategoryId, selectCategory } =
    useCategoryPickerSheet();

  return (
    <NativeForm title={t(k.categoryPicker.title)}>
      {isLoading ? (
        <FormSection>
          <FormLoadingRow />
        </FormSection>
      ) : isEmpty ? (
        <FormSection>
          <FormEmptyRow
            title={t(k.categoryPicker.empty)}
            description={t(k.categoryPicker.emptyMessage)}
            symbol={EMPTY_SYMBOL}
          />
        </FormSection>
      ) : (
        groups.map((group) => (
          <FormSection
            key={group.type}
            title={t(group.type === 'expense' ? k.common.expense : k.common.income)}
          >
            {group.items.map(({ category, symbol }) => (
              <FormListRow
                key={category.id}
                title={category.name}
                symbol={symbol}
                selected={category.id === selectedCategoryId}
                onPress={() => selectCategory(category)}
              />
            ))}
          </FormSection>
        ))
      )}
    </NativeForm>
  );
}
