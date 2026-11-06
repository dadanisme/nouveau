import { Host, VStack } from '@expo/ui/swift-ui';
import { padding } from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FormPrimaryButtonRow,
  type FormPrimaryButtonRowProps,
} from '@/components/form-primary-button-row';
import { ACCENT_COLOR } from '@/constants/accent';

// HIG layout: the system's 20pt side margins on iPhone.
const SIDE = 20;
const GAP = 12;

/**
 * A screen's one primary action pinned under a scrolling form, so it's always a tap away (the
 * onboarding currency step's Continue): a large prominent capsule on the grouped background,
 * above the home indicator. Render it after the `NativeForm`, in a flex column.
 */
export function FormBottomAction(props: FormPrimaryButtonRowProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, GAP) }]}>
      <Host matchContents={{ vertical: true }} seedColor={ACCENT_COLOR}>
        <VStack modifiers={[padding({ horizontal: SIDE, top: GAP })]}>
          <FormPrimaryButtonRow {...props} />
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: PlatformColor('systemGroupedBackground') },
});
