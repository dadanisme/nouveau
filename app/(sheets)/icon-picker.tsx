import { ScrollView, StyleSheet, Text } from 'react-native';

import { IconGrid } from '@/components/icon-grid';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useIconPickerSheet } from '@/hooks/use-icon-picker-sheet';
import { k } from '@/locales/keys';

/**
 * Category icon picker sheet. Params: `selected`, `color`, `requestId`; result: `icon-picker`.
 * The grid is legacy until #31 rebuilds it natively.
 */
export default function IconPickerSheet() {
  const { t } = useLanguage();
  const { selectedIcon, accentColor, selectIcon } = useIconPickerSheet();

  return (
    // First child so iOS can expand the sheet when it's scrolled to the edge; Android needs
    // nested scrolling inside the sheet's own drag behavior.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Text style={styles.title}>{t(k.categories.chooseIcon)}</Text>
      <IconGrid selectedIcon={selectedIcon} accentColor={accentColor} onSelect={selectIcon} />
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
    paddingBottom: design.spacing.xl * 2,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    marginBottom: design.spacing.md,
  },
});
