import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import type { Tables } from '@/types/supabase';
import { parseIcon } from '@/utils/icon';

interface CategoryGridProps {
  categories: Tables<'categories'>[];
  selectedCategoryId: string | null;
  onSelect: (category: Tables<'categories'>) => void;
}

const COLUMNS = 3;

/**
 * Legacy category grid, shared by the `category-picker` sheet route and the legacy
 * `CategoryPicker` bottom sheet until #29/#31 rebuild it natively.
 */
export function CategoryGrid({ categories, selectedCategoryId, onSelect }: CategoryGridProps) {
  const rows: Tables<'categories'>[][] = [];
  for (let i = 0; i < categories.length; i += COLUMNS) {
    rows.push(categories.slice(i, i + COLUMNS));
  }

  return (
    <View>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
