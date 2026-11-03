import { ScrollView, StyleSheet, Text } from 'react-native';

import { CategoryGrid } from '@/components/category-grid';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useCategoryPickerSheet } from '@/hooks/use-category-picker-sheet';
import { k } from '@/locales/keys';

/**
 * Category picker sheet. Params: `type`, `selectedId`, `requestId`; result: `category-picker`.
 * The grid content is legacy until #29/#31 rebuild it as a native list.
 */
export default function CategoryPickerSheet() {
  const { t } = useLanguage();
  const { categories, selectedCategoryId, selectCategory } = useCategoryPickerSheet();

  return (
    // The ScrollView is the sheet's first child so iOS can expand the sheet when it is scrolled
    // to the edge; Android needs nested scrolling inside the sheet's own drag behavior.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Text style={styles.title}>{t(k.categoryPicker.title)}</Text>
      <CategoryGrid
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={selectCategory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: design.spacing.xl,
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    marginBottom: design.spacing.md,
  },
});
