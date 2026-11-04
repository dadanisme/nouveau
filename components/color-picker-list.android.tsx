import {
  Box,
  Column,
  LazyColumn,
  ListItem,
  RadioButton,
  Text,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  padding,
  selectable,
  selectableGroup,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import { ComposeHost } from '@/components/compose-host';
import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import {
  systemColorValue,
  type CategorySystemColor,
  type CategorySystemColorId,
} from '@/utils/category-color';

// Material 3 metrics: 24dp sheet padding, 24dp leading swatch in a one-line list item.
const SHEET_PADDING = 24;
const SWATCH_SIZE = 24;
// Sheets don't inset for the gesture bar, so the last row clears it.
const SHEET_BOTTOM = 72;

// The system palette (as in `native-form`); the accent only tints, as the `primary` role.
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

interface ColorPickerListProps {
  colors: readonly CategorySystemColor[];
  selectedId: CategorySystemColorId | null;
  onSelect: (id: CategorySystemColorId) => void;
}

/**
 * The color picker sheet body on Android: a Compose single-choice list (`ListItem` rows with a
 * color swatch, the name and a trailing `RadioButton`; the whole row is the radio target).
 */
export function ColorPickerList({ colors, selectedId, onSelect }: ColorPickerListProps) {
  const { t } = useLanguage();
  const palette = useMaterialColors();

  return (
    <ComposeHost style={styles.host} colorOverrides={COLOR_OVERRIDES}>
      <LazyColumn
        contentPadding={{ top: SHEET_PADDING, bottom: SHEET_BOTTOM }}
        modifiers={[fillMaxSize(), background(palette.surfaceContainerLow)]}
      >
        <Text
          style={{ typography: 'titleLarge' }}
          color={palette.onSurface}
          modifiers={[padding(SHEET_PADDING, 0, SHEET_PADDING, 8)]}
        >
          {t(k.categories.chooseColor)}
        </Text>
        <Column modifiers={[selectableGroup()]}>
          {colors.map((color) => {
            const isSelected = color.id === selectedId;
            return (
              <ListItem
                key={color.id}
                colors={{ containerColor: palette.surfaceContainerLow }}
                modifiers={[selectable(isSelected, () => onSelect(color.id), 'radioButton')]}
              >
                <ListItem.LeadingContent>
                  <Box
                    modifiers={[
                      size(SWATCH_SIZE, SWATCH_SIZE),
                      clip(Shapes.Circle),
                      background(systemColorValue(color)),
                    ]}
                  />
                </ListItem.LeadingContent>
                <ListItem.HeadlineContent>
                  <Text>{t(color.labelKey)}</Text>
                </ListItem.HeadlineContent>
                <ListItem.TrailingContent>
                  {/* The row handles the tap; the radio only shows the state. */}
                  <RadioButton selected={isSelected} />
                </ListItem.TrailingContent>
              </ListItem>
            );
          })}
        </Column>
      </LazyColumn>
    </ComposeHost>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
