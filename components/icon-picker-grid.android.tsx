import {
  Box,
  Column,
  FlowRow,
  Icon,
  IconToggleButton,
  LazyColumn,
  Text,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import { background, fillMaxSize, size } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet, type ColorValue } from 'react-native';

import { ComposeHost } from '@/components/compose-host';
import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { useMaterialSymbolSources } from '@/hooks/use-material-symbol-sources';
import { k } from '@/locales/keys';
import {
  getIoniconSymbol,
  type CategoryIconGroup,
  type CategoryIconName,
} from '@/utils/category-icon';
import { getIconLabelKey } from '@/utils/category-icon-label';

// Material 3 metrics: 24dp icons in 48dp icon buttons, 24dp sheet padding.
const ICON_SIZE = 24;
const SHEET_PADDING = 24;
// Sheets don't inset for the gesture bar, so the last row clears it.
const SHEET_BOTTOM = 72;

// The system palette (as in `native-form`); the accent only tints, as the `primary` role.
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

interface IconPickerGridProps {
  groups: readonly CategoryIconGroup[];
  selectedIcon: string | null;
  /** Tints the selected icon (the category's color). */
  selectedColor: ColorValue;
  onSelect: (icon: CategoryIconName) => void;
}

/**
 * The icon picker sheet body on Android: a Compose `LazyColumn` with one titled `FlowRow` of
 * icon toggle buttons per group. Material Symbols come from the font via
 * `useMaterialSymbolSources` (no vector asset per icon). The selected icon sits on the tonal container
 * in the category color.
 */
export function IconPickerGrid({
  groups,
  selectedIcon,
  selectedColor,
  onSelect,
}: IconPickerGridProps) {
  const { t } = useLanguage();
  const palette = useMaterialColors();
  const sources = useMaterialSymbolSources(
    groups.flatMap((group) => group.icons.map((name) => getIoniconSymbol(name).material)),
    ICON_SIZE,
  );

  return (
    <ComposeHost style={styles.host} colorOverrides={COLOR_OVERRIDES}>
      <LazyColumn
        verticalArrangement={{ spacedBy: 16 }}
        contentPadding={{
          start: SHEET_PADDING,
          top: SHEET_PADDING,
          end: SHEET_PADDING,
          bottom: SHEET_BOTTOM,
        }}
        modifiers={[fillMaxSize(), background(palette.surfaceContainerLow)]}
      >
        <Text style={{ typography: 'titleLarge' }} color={palette.onSurface}>
          {t(k.categories.chooseIcon)}
        </Text>
        {groups.map((group) => (
          <Column key={group.labelKey} verticalArrangement={{ spacedBy: 8 }}>
            <Text style={{ typography: 'titleSmall' }} color={palette.onSurfaceVariant}>
              {t(group.labelKey)}
            </Text>
            <FlowRow horizontalArrangement={{ spacedBy: 4 }} verticalArrangement={{ spacedBy: 4 }}>
              {group.icons.map((name) => {
                const source = sources.get(getIoniconSymbol(name).material);
                return (
                  <IconToggleButton
                    key={name}
                    checked={name === selectedIcon}
                    onCheckedChange={() => onSelect(name)}
                    colors={{
                      contentColor: palette.onSurfaceVariant,
                      checkedContainerColor: palette.secondaryContainer,
                      checkedContentColor: selectedColor,
                    }}
                  >
                    {source ? (
                      <Icon
                        source={source}
                        size={ICON_SIZE}
                        contentDescription={t(getIconLabelKey(name))}
                      />
                    ) : (
                      <Box modifiers={[size(ICON_SIZE, ICON_SIZE)]} />
                    )}
                  </IconToggleButton>
                );
              })}
            </FlowRow>
          </Column>
        ))}
      </LazyColumn>
    </ComposeHost>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
