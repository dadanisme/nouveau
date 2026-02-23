import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { CATEGORY_ICON_GROUPS } from '@/constants/category-icons';
import { colors, design } from '@/constants/colors';

const COLUMNS = 5;

interface IconPickerProps {
  visible: boolean;
  selectedIcon: string | null;
  accentColor: string;
  onSelect: (icon: string) => void;
  onDismiss: () => void;
}

export function IconPicker({
  visible,
  selectedIcon,
  accentColor,
  onSelect,
  onDismiss,
}: IconPickerProps) {
  const { width } = useWindowDimensions();
  const padding = design.spacing.lg * 2;
  const sheetBorder = design.borderWidth * 2;
  const shadowOffset = design.shadow.shadowOffset.width;
  const totalGap = design.spacing.sm * (COLUMNS - 1);
  const cellSize = Math.floor((width - padding - sheetBorder - shadowOffset - totalGap) / COLUMNS);

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} snapPoints={['70%']} stackBehavior="push">
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Icon</Text>
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
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl * 2,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    marginBottom: design.spacing.md,
  },
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
