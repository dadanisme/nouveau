import {
  Box,
  CircularProgressIndicator,
  Column,
  Host,
  Icon,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import type { ContentPlaceholderProps } from '@/components/form-extras-types';

const ICON_SIZE = 48;

function Placeholder({ title, message, icon }: ContentPlaceholderProps) {
  const colors = useMaterialColors();
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxWidth(), padding(24, 48, 24, 48)]}
    >
      <Icon source={icon.md} size={ICON_SIZE} tint={colors.onSurfaceVariant} />
      <Text style={{ typography: 'titleMedium', textAlign: 'center' }}>{title}</Text>
      {message ? (
        <Text
          color={colors.onSurfaceVariant}
          style={{ typography: 'bodyMedium', textAlign: 'center' }}
        >
          {message}
        </Text>
      ) : null}
    </Column>
  );
}

/** An empty or error state as an item of a form's `LazyColumn`. */
export function FormPlaceholderRow(props: ContentPlaceholderProps) {
  return <Placeholder {...props} />;
}

/** A centered M3 progress indicator inside a form while its rows load. */
export function FormLoadingRow() {
  return (
    <Box contentAlignment="center" modifiers={[fillMaxWidth(), padding(0, 48, 0, 48)]}>
      <CircularProgressIndicator />
    </Box>
  );
}

/**
 * An empty or error state centered in its parent, for screens (or cells) that aren't forms. It
 * paints no background: the parent view provides it (see `useSystemColors`).
 */
export function ScreenPlaceholder(props: ContentPlaceholderProps) {
  return (
    <Host style={styles.fill}>
      <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
        <Placeholder {...props} />
      </Box>
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
