import { Button, Form, Grid, Host, Image, Section, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityLabel,
  background,
  buttonStyle,
  font,
  frame,
  shapes,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet, type ColorValue } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';
import { chunk } from '@/utils/array';
import {
  getIoniconSymbol,
  type CategoryIconGroup,
  type CategoryIconName,
} from '@/utils/category-icon';
import { getIconLabelKey } from '@/utils/category-icon-label';

// Five cells of at least 44pt with ~12pt between the bezels fit a phone-width inset-grouped row
// (cells stretch to share the row's width); three at accessibility text sizes, where the glyphs
// grow (HIG: "Reduce the number of columns when the font size increases").
const COLUMNS = 5;
const ACCESSIBILITY_COLUMNS = 3;
const CELL_SPACING = 12;
// The circle's size at the default text size; it grows with the text (up to 2x) so every circle
// in the grid stays the same size, whatever the glyph's shape.
const CELL_SIZE = 44;

interface IconPickerGridProps {
  groups: readonly CategoryIconGroup[];
  selectedIcon: string | null;
  /** Tints the selected icon (the category's color). */
  selectedColor: ColorValue;
  onSelect: (icon: CategoryIconName) => void;
}

/**
 * The icon picker sheet body on iOS: a SwiftUI `Form` with one section per icon group, each a
 * `Grid` of SF Symbol buttons. The selected icon takes the category color and a ring.
 */
export function IconPickerGrid({
  groups,
  selectedIcon,
  selectedColor,
  onSelect,
}: IconPickerGridProps) {
  const { t } = useLanguage();
  const columns = useIsAccessibilityTextSize() ? ACCESSIBILITY_COLUMNS : COLUMNS;
  const cellSize = useScaledSize(CELL_SIZE);

  return (
    <Host style={styles.host} seedColor={ACCENT_COLOR}>
      <VStack
        spacing={0}
        modifiers={[
          background(PlatformColor('systemGroupedBackground'), { ignoresSafeAreaEdges: 'all' }),
        ]}
      >
        <Form>
          {groups.map((group) => (
            <Section key={group.labelKey} title={t(group.labelKey)}>
              <Grid horizontalSpacing={CELL_SPACING} verticalSpacing={CELL_SPACING}>
                {chunk(group.icons, columns).map((row) => (
                  <Grid.Row key={row[0]}>
                    {row.map((name) => {
                      const isSelected = name === selectedIcon;
                      return (
                        <Button
                          key={name}
                          onPress={() => onSelect(name)}
                          modifiers={[
                            buttonStyle('plain'),
                            frame({ maxWidth: Infinity }),
                            accessibilityLabel(t(getIconLabelKey(name))),
                            ...(isSelected ? [accessibilityAddTraits(['isSelected'])] : []),
                          ]}
                        >
                          <Image
                            systemName={getIoniconSymbol(name).sf}
                            color={isSelected ? selectedColor : PlatformColor('secondaryLabel')}
                            modifiers={[
                              // A text style, so the glyph and its cell grow with Dynamic Type.
                              font({ textStyle: 'title2' }),
                              frame({ width: cellSize, height: cellSize }),
                              background(PlatformColor('tertiarySystemFill'), shapes.circle()),
                              ...(isSelected
                                ? [
                                    strokeBorder({
                                      color: selectedColor,
                                      shape: 'circle',
                                      style: { lineWidth: 2 },
                                    }),
                                  ]
                                : []),
                            ]}
                          />
                        </Button>
                      );
                    })}
                  </Grid.Row>
                ))}
              </Grid>
            </Section>
          ))}
        </Form>
      </VStack>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
