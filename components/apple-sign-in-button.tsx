import { RNHostView, VStack } from '@expo/ui/swift-ui';
import {
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
} from '@expo/ui/swift-ui/modifiers';
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { SOCIAL_BUTTON_HEIGHT } from '@/constants/google-branding';

export type AppleSignInButtonProps = {
  /** "Sign in with Apple" (Login) or "Sign up with Apple" (Signup). */
  variant: 'signIn' | 'signUp';
  disabled?: boolean;
  onPress: () => void;
};

const HEIGHT = SOCIAL_BUTTON_HEIGHT.ios;

/**
 * The system Sign in with Apple button (`ASAuthorizationAppleIDButton`), full width on a clear
 * `Form` row, the same height and pill corners as the Google button. Black on light appearance,
 * white on dark, per Apple's guidelines. Render it only when `useAppleSignInAvailable()` is true.
 */
export function AppleSignInButton({ variant, disabled, onPress }: AppleSignInButtonProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <VStack
      modifiers={[
        frame({ maxWidth: Infinity }),
        listRowBackground('clear'),
        listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
        listRowSeparator('hidden'),
      ]}
    >
      {/* Width from the row, height from the button. */}
      <RNHostView matchContents={{ vertical: true }}>
        <View
          pointerEvents={disabled ? 'none' : 'auto'}
          style={[styles.container, disabled && styles.disabled]}
        >
          <AppleAuthenticationButton
            // The native button is created per type and style, so a change remounts it.
            key={`${variant}-${isDark ? 'dark' : 'light'}`}
            buttonType={
              variant === 'signUp'
                ? AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              isDark ? AppleAuthenticationButtonStyle.WHITE : AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={HEIGHT / 2}
            style={styles.button}
            onPress={onPress}
          />
        </View>
      </RNHostView>
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  disabled: { opacity: 0.4 },
  button: { width: '100%', height: HEIGHT },
});
