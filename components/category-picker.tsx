import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { colors, design } from '@/constants/colors';
import type { Tables } from '@/types/supabase';

interface CategoryPickerProps {
  visible: boolean;
  categories: Tables<'categories'>[];
  selectedCategoryId: string | null;
  onSelect: (category: Tables<'categories'>) => void;
  onDismiss: () => void;
}

export function CategoryPicker({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onDismiss,
}: CategoryPickerProps) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} snapPoints={['60%']}>
      <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select Category</Text>
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;
          return (
            <Pressable
              key={category.id}
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => onSelect(category)}
            >
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                {category.name}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={20} color={colors.black} />}
            </Pressable>
          );
        })}
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
    marginBottom: design.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.sm,
    borderRadius: design.radius.sm,
    gap: design.spacing.sm,
  },
  rowSelected: {
    backgroundColor: colors.primary.light,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  rowText: {
    flex: 1,
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[700],
  },
  rowTextSelected: {
    color: colors.black,
    fontWeight: '800',
  },
});
