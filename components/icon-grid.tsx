import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/button';
import { CATEGORY_ICON_GROUPS } from '@/constants/category-icons';
import { colors, design } from '@/constants/colors';

const COLUMNS = 5;

interface IconGridProps {
  selectedIcon: string | null;
  /** Fill of the selected cell (the category's color). */
  accentColor: string;
  onSelect: (icon: string) => void;
}

/**
 * Legacy sectioned Ionicons grid for the `icon-picker` sheet route, until #31 rebuilds it as a
 * native SF Symbol / Material Symbol grid. Lays out for a full-width sheet with `design.spacing.lg`
 * side padding.
 */
export function IconGrid({ selectedIcon, accentColor, onSelect }: IconGridProps) {
  const { width } = useWindowDimensions();
  const totalGap = design.spacing.sm * (COLUMNS - 1);
  const cellSize = Math.floor((width - design.spacing.lg * 2 - totalGap) / COLUMNS);

  return (
    <View>
      {CATEGORY_ICON_GROUPS.map((group) => (
        <View key={group.label} style={styles.section}>
          <Text style={styles.sectionLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {group.icons.map((icon) => {
              const isSelected = icon === selectedIcon;
              return (
                <Button
                  key={icon}
                  variant={isSelected ? 'primary' : 'outline'}
                  style={StyleSheet.flatten([
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    isSelected && { backgroundColor: accentColor },
                  ])}
                  onPress={() => onSelect(icon)}
                  accessibilityLabel={icon}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={28}
                    color={isSelected ? colors.white : colors.gray[700]}
                  />
                </Button>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: design.spacing.md,
  },
  sectionLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: design.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: design.spacing.sm,
  },
  cell: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.md,
  },
});
