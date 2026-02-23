import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { CATEGORY_COLORS } from '@/constants/category-colors';
import { colors, design } from '@/constants/colors';

interface ColorPickerProps {
  visible: boolean;
  selectedColor: string;
  onSelect: (color: string) => void;
  onDismiss: () => void;
}

export function ColorPicker({ visible, selectedColor, onSelect, onDismiss }: ColorPickerProps) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} snapPoints={['35%']} stackBehavior="push">
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Choose Color</Text>
        <View style={styles.grid}>
          {CATEGORY_COLORS.map((color) => {
            const isSelected = color === selectedColor;
            return (
              <Pressable key={color} style={styles.swatchWrapper} onPress={() => onSelect(color)}>
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
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: design.spacing.lg,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: design.spacing.md,
  },
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
