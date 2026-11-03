import { Button, Form, Grid, Host, Image, Section, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityLabel,
  background,
  buttonStyle,
  frame,
  shapes,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet, type ColorValue } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { chunk } from '@/utils/array';
import {
  getIconAccessibilityLabel,
  getIoniconSymbol,
  type CategoryIconGroup,
  type CategoryIconName,
} from '@/utils/category-icon';

// Six 44pt cells fit a phone-width inset-grouped row; cells stretch to share the row's width.
const COLUMNS = 6;
const CELL_SIZE = 44;
const GLYPH_SIZE = 22;

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
              <Grid horizontalSpacing={4} verticalSpacing={8}>
                {chunk(group.icons, COLUMNS).map((row) => (
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
                            accessibilityLabel(getIconAccessibilityLabel(name)),
                            ...(isSelected ? [accessibilityAddTraits(['isSelected'])] : []),
                          ]}
                        >
                          <Image
                            systemName={getIoniconSymbol(name).sf}
                            size={GLYPH_SIZE}
                            color={isSelected ? selectedColor : PlatformColor('secondaryLabel')}
                            modifiers={[
                              frame({ width: CELL_SIZE, height: CELL_SIZE }),
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
