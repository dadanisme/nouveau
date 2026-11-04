import { ContentUnavailableView, Host } from '@expo/ui/swift-ui';
import { StyleSheet } from 'react-native';

import type { ScreenPlaceholderProps } from '@/components/form-extras-types';

/**
 * An empty or error state (`ContentUnavailableView`) filling its parent, for screens (or cells)
 * that aren't a form; inside a form use `FormEmptyRow`. It paints no background: the parent view
 * provides it (see `useSystemColors`).
 */
export function ScreenPlaceholder({ title, description, symbol }: ScreenPlaceholderProps) {
  return (
    <Host style={styles.fill}>
      <ContentUnavailableView title={title} description={description} systemImage={symbol.sf} />
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
