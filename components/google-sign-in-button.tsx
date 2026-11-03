import { Button, HStack, RNHostView, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  background,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  shapes,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { GOOGLE_BUTTON_COLORS, SOCIAL_BUTTON_HEIGHT } from '@/constants/google-branding';

export type GoogleSignInButtonProps = {
  title: string;
  disabled?: boolean;
  onPress: () => void;
};

const LOGO_SIZE = 20;

/**
 * The "Sign in with Google" button per Google's branding guidelines: the standard multicolor
 * "G" on the light (or, in dark appearance, dark) pill with its 1pt stroke, full width on a
 * clear `Form` row so it lines up with the primary button.
 */
export function GoogleSignInButton({
  title,
  disabled: isDisabled,
  onPress,
}: GoogleSignInButtonProps) {
  const colors = GOOGLE_BUTTON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle('plain'),
        disabled(Boolean(isDisabled)),
        accessibilityLabel(title),
        listRowBackground('clear'),
        listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
        listRowSeparator('hidden'),
      ]}
    >
      <HStack
        spacing={10}
        modifiers={[
          frame({ maxWidth: Infinity, minHeight: SOCIAL_BUTTON_HEIGHT.ios }),
          background(colors.fill, shapes.capsule()),
          strokeBorder({ content: colors.stroke, shape: 'capsule' }),
        ]}
      >
        {/* SwiftUI images take SF Symbols or files only, so the bundled logo is an RN image. It
            ignores touches so the tap lands on the SwiftUI button. */}
        <RNHostView matchContents>
          <View pointerEvents="none">
            <Image source={require('@/assets/images/google-g.png')} style={styles.logo} />
          </View>
        </RNHostView>
        <Text
          modifiers={[font({ textStyle: 'body', weight: 'medium' }), foregroundStyle(colors.text)]}
        >
          {title}
        </Text>
      </HStack>
    </Button>
  );
}

const styles = StyleSheet.create({
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
});
