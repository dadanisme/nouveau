import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { CategoryGrid } from '@/components/category-grid';
import { colors, design } from '@/constants/colors';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';

interface CategoryPickerProps {
  visible: boolean;
  categories: Tables<'categories'>[];
  selectedCategoryId: string | null;
  onSelect: (category: Tables<'categories'>) => void;
  onDismiss: () => void;
  /** Use 'push' to stack on top of an already-open sheet instead of replacing it */
  stackBehavior?: 'push' | 'replace';
}

export function CategoryPicker({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onDismiss,
  stackBehavior,
}: CategoryPickerProps) {
  return (
    <BottomSheet
      visible={visible}
      onDismiss={onDismiss}
      snapPoints={['60%']}
      stackBehavior={stackBehavior}
    >
      <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{i18n.t(k.categoryPicker.title)}</Text>
        <CategoryGrid
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={onSelect}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    marginBottom: design.spacing.md,
  },
});
