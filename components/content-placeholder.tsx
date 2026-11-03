import { ContentUnavailableView, HStack, Host, ProgressView, Spacer } from '@expo/ui/swift-ui';
import { listRowBackground } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import type { ContentPlaceholderProps } from '@/components/form-extras-types';

const CLEAR_ROW = listRowBackground('clear');

/** An empty or error state inside a form: SwiftUI `ContentUnavailableView` on a clear row. */
export function FormPlaceholderRow({ title, message, icon }: ContentPlaceholderProps) {
  return (
    <ContentUnavailableView
      title={title}
      description={message}
      systemImage={icon.sf}
      modifiers={[CLEAR_ROW]}
    />
  );
}

/** A centered spinner inside a form while its rows load. */
export function FormLoadingRow() {
  return (
    <HStack modifiers={[CLEAR_ROW]}>
      <Spacer />
      <ProgressView />
      <Spacer />
    </HStack>
  );
}

/**
 * An empty or error state (`ContentUnavailableView`) filling its parent, for screens (or cells)
 * that aren't forms. It paints no background: the parent view provides it (see `useSystemColors`).
 */
export function ScreenPlaceholder({ title, message, icon }: ContentPlaceholderProps) {
  return (
    <Host style={styles.fill}>
      <ContentUnavailableView title={title} description={message} systemImage={icon.sf} />
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
