import {
  Column,
  RNHostView,
  Text,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxSize,
  fillMaxWidth,
  padding,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/app-logo';
import { AuthSwitchRow } from '@/components/auth-form';
import { ComposeHost } from '@/components/compose-host';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { OnboardingWelcomeProps } from '@/components/onboarding-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 compact metrics: 24dp side margins for the intro text, 16dp under the actions (the
// buttons carry their own 16dp side padding).
const SIDE = 24;
const BOTTOM = 16;

// The system (dynamic) palette; the accent only tints, as the `primary` role (the filled button,
// the Sign In text button). `onPrimary` is its pairing: white on the accent in both themes.
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * Welcome (Android): the logo, headline and supporting text centered in the space above, then a
 * full-width M3 filled Get Started and the "Already have an account? Sign in" text button.
 */
export function OnboardingWelcome(props: OnboardingWelcomeProps) {
  return (
    <ComposeHost style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <WelcomeSurface {...props} />
    </ComposeHost>
  );
}

function WelcomeSurface(props: OnboardingWelcomeProps) {
  const colors = useMaterialColors();
  const insets = useSafeAreaInsets();

  return (
    <Column
      horizontalAlignment="center"
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        padding(0, insets.top, 0, insets.bottom + BOTTOM),
      ]}
    >
      <Column
        horizontalAlignment="center"
        verticalArrangement="center"
        modifiers={[fillMaxWidth(), weight(1), padding(SIDE, 0, SIDE, 0)]}
      >
        <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 16 }}>
          <RNHostView matchContents>
            <AppLogo />
          </RNHostView>
          <Text
            color={colors.onSurface}
            style={{ typography: 'headlineMedium', textAlign: 'center' }}
          >
            {props.title}
          </Text>
          <Text
            color={colors.onSurfaceVariant}
            style={{ typography: 'bodyLarge', textAlign: 'center' }}
          >
            {props.body}
          </Text>
        </Column>
      </Column>
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
        <FormPrimaryButtonRow title={props.getStartedLabel} onPress={props.onGetStarted} />
        <AuthSwitchRow
          prompt={props.signInPrompt}
          action={props.signInLabel}
          onPress={props.onSignIn}
        />
      </Column>
    </Column>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
