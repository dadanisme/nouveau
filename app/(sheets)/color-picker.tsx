import { StyleSheet, Text, View } from 'react-native';

import { ColorGrid } from '@/components/color-grid';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useColorPickerSheet } from '@/hooks/use-color-picker-sheet';
import { k } from '@/locales/keys';

/**
 * Category color picker sheet (fits its content). Params: `selected`, `requestId`; result:
 * `color-picker`. The swatches are legacy until #31 swaps in system colors.
 */
export default function ColorPickerSheet() {
  const { t } = useLanguage();
  const { selectedColor, selectColor } = useColorPickerSheet();

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{t(k.categories.chooseColor)}</Text>
      <ColorGrid selectedColor={selectedColor} onSelect={selectColor} />
    </View>
  );
}

const styles = StyleSheet.create({
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
