import { Form, Host } from '@expo/ui/swift-ui';
import { refreshable } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import type { RefreshableFormProps } from '@/components/form-extras-types';
import { ACCENT_COLOR } from '@/constants/accent';

/**
 * `NativeForm` with pull-to-refresh: a SwiftUI grouped `Form` with `.refreshable`, which shows the
 * system spinner until `onRefresh` resolves. Render it as the screen's root.
 */
export function RefreshableForm({ onRefresh, children }: RefreshableFormProps) {
  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      <Form modifiers={[refreshable(onRefresh)]}>{children}</Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
