import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';
import { parseIcon } from '@/utils/icon';

interface CategoryPickerProps {
  visible: boolean;
  categories: Tables<'categories'>[];
  selectedCategoryId: string | null;
  onSelect: (category: Tables<'categories'>) => void;
  onDismiss: () => void;
  /** Use 'push' to stack on top of an already-open sheet instead of replacing it */
  stackBehavior?: 'push' | 'replace';
}

const COLUMNS = 3;

export function CategoryPicker({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onDismiss,
  stackBehavior,
}: CategoryPickerProps) {
  const rows: Tables<'categories'>[][] = [];
  for (let i = 0; i < categories.length; i += COLUMNS) {
    rows.push(categories.slice(i, i + COLUMNS));
  }

  return (
    <BottomSheet
      visible={visible}
      onDismiss={onDismiss}
      snapPoints={['60%']}
      stackBehavior={stackBehavior}
    >
      <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{i18n.t(k.categoryPicker.title)}</Text>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              const parsed = category.icon ? parseIcon(category.icon) : null;
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? 'primary' : 'outline'}
                  style={StyleSheet.flatten([styles.cell])}
                  onPress={() => onSelect(category)}
                >
                  <View style={styles.cellContent}>
                    {parsed ? (
                      <Ionicons
                        name={parsed.name as keyof typeof Ionicons.glyphMap}
                        size={32}
                        color={isSelected ? colors.black : category.color}
                      />
                    ) : (
                      <View style={[styles.dot, { backgroundColor: category.color }]} />
                    )}
                    <Text
                      style={[styles.cellText, isSelected && styles.cellTextSelected]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                  </View>
                </Button>
              );
            })}
            {/* Fill empty cells to maintain grid alignment */}
            {row.length < COLUMNS &&
              Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.cellSpacer} />
              ))}
          </View>
        ))}
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
  row: {
    flexDirection: 'row',
    gap: design.spacing.sm,
    marginBottom: design.spacing.sm,
  },
  cell: {
    flex: 1,
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.xs,
  },
  cellContent: {
    alignItems: 'center',
    gap: design.spacing.xs + 2,
  },
  cellSpacer: {
    flex: 1,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
  },
  cellText: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },
  cellTextSelected: {
    color: colors.black,
    fontWeight: '800',
  },
});
