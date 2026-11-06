import { Host, RNHostView, ScrollView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import { AppLogo } from '@/components/app-logo';
import { AuthSwitchRow } from '@/components/auth-form';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { OnboardingWelcomeProps } from '@/components/onboarding-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

// HIG layout: the system's 20pt side margins on iPhone.
const SIDE = 20;

/**
 * Welcome (iOS): the logo, title and body centered in the space above, then Get Started (a large
 * prominent capsule) and the "Already have an account? Sign In" link under it. At accessibility
 * text sizes everything scrolls from the top instead.
 */
export function OnboardingWelcome(props: OnboardingWelcomeProps) {
  const isLargeText = useIsAccessibilityTextSize();

  const intro = (
    <VStack spacing={16} modifiers={[frame({ maxWidth: Infinity })]}>
      <RNHostView matchContents>
        <AppLogo />
      </RNHostView>
      <Text
        modifiers={[
          font({ textStyle: 'largeTitle', weight: 'bold' }),
          multilineTextAlignment('center'),
        ]}
      >
        {props.title}
      </Text>
      <Text
        modifiers={[
          font({ textStyle: 'body' }),
          foregroundStyle(PlatformColor('secondaryLabel')),
          multilineTextAlignment('center'),
        ]}
      >
        {props.body}
      </Text>
    </VStack>
  );

  const actions = (
    <VStack spacing={8}>
      <FormPrimaryButtonRow title={props.getStartedLabel} onPress={props.onGetStarted} />
      <AuthSwitchRow
        prompt={props.signInPrompt}
        action={props.signInLabel}
        accessibilityLabel={props.signInLabel}
        onPress={props.onSignIn}
      />
    </VStack>
  );

  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      {isLargeText ? (
        <ScrollView>
          <VStack spacing={32} modifiers={[padding({ horizontal: SIDE, vertical: 24 })]}>
            {intro}
            {actions}
          </VStack>
        </ScrollView>
      ) : (
        <VStack spacing={0} modifiers={[padding({ horizontal: SIDE, bottom: 8 })]}>
          <Spacer />
          {intro}
          <Spacer />
          {actions}
        </VStack>
      )}
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
