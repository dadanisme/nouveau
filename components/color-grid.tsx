import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORY_COLORS } from '@/constants/category-colors';
import { colors, design } from '@/constants/colors';

interface ColorGridProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

/**
 * Legacy swatch grid for the `color-picker` sheet route, until #31 swaps in ~8 system colors.
 */
export function ColorGrid({ selectedColor, onSelect }: ColorGridProps) {
  return (
    <View style={styles.grid}>
      {CATEGORY_COLORS.map((color) => {
        const isSelected = color === selectedColor;
        return (
          <Pressable
            key={color}
            style={styles.swatchWrapper}
            onPress={() => onSelect(color)}
            accessibilityRole="button"
            accessibilityLabel={color}
            accessibilityState={{ selected: isSelected }}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: color },
                isSelected && styles.swatchSelected,
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={22} color={colors.white} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: design.spacing.sm,
  },
  swatchWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
  },
});
