import { Box, Column, Host, Icon, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding, size } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import type { ScreenPlaceholderProps } from '@/components/form-extras-types';
import { useMaterialSymbolSources } from '@/hooks/use-material-symbol-sources';

const ICON_SIZE = 48;

/**
 * An empty or error state centered in its parent, for screens (or cells) that aren't a form;
 * inside a form use `FormEmptyRow`. It paints no background: the parent view provides it (see
 * `useSystemColors`).
 */
export function ScreenPlaceholder(props: ScreenPlaceholderProps) {
  return (
    <Host style={styles.fill}>
      <Placeholder {...props} />
    </Host>
  );
}

function Placeholder({ title, description, symbol }: ScreenPlaceholderProps) {
  const colors = useMaterialColors();
  const source = useMaterialSymbolSources([symbol.material], ICON_SIZE).get(symbol.material);

  return (
    <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 8 }}
        modifiers={[fillMaxWidth(), padding(24, 24, 24, 24)]}
      >
        {source ? (
          <Icon source={source} size={ICON_SIZE} tint={colors.onSurfaceVariant} />
        ) : (
          <Box modifiers={[size(ICON_SIZE, ICON_SIZE)]} />
        )}
        <Text color={colors.onSurface} style={{ typography: 'titleMedium', textAlign: 'center' }}>
          {title}
        </Text>
        {description ? (
          <Text
            color={colors.onSurfaceVariant}
            style={{ typography: 'bodyMedium', textAlign: 'center' }}
          >
            {description}
          </Text>
        ) : null}
      </Column>
    </Box>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
