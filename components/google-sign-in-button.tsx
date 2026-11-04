import { Button, HStack, Image, Text } from '@expo/ui/swift-ui';
import {
  accessibilityHidden,
  accessibilityLabel,
  background,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  minimumScaleFactor,
  padding,
  resizable,
  shapes,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import { useAssets } from 'expo-asset';
import { useColorScheme } from 'react-native';

import { GOOGLE_BUTTON_COLORS, SOCIAL_BUTTON_HEIGHT } from '@/constants/google-branding';
import { useScaledSize } from '@/hooks/use-accessibility-text-size';

export type GoogleSignInButtonProps = {
  title: string;
  disabled?: boolean;
  onPress: () => void;
};

const LOGO_SIZE = 20;

/**
 * The "Sign in with Google" button per Google's branding guidelines: the standard multicolor
 * "G" on the light (or, in dark appearance, dark) pill with its 1pt stroke, full width on a
 * clear `Form` row so it lines up with the primary button. Its height and logo grow with the text
 * size, from the same height as the Apple button; the title stays on one line and shrinks to fit.
 */
export function GoogleSignInButton({
  title,
  disabled: isDisabled,
  onPress,
}: GoogleSignInButtonProps) {
  const colors = GOOGLE_BUTTON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const height = useScaledSize(SOCIAL_BUTTON_HEIGHT.ios);
  const logoSize = useScaledSize(LOGO_SIZE);
  // The bundled logo as a local file, so SwiftUI draws it natively (and redraws it with the
  // appearance and contrast traits).
  const [logo] = useAssets(require('@/assets/images/google-g.png'));
  const logoUri = logo?.[0]?.localUri;

  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle('plain'),
        disabled(Boolean(isDisabled)),
        accessibilityLabel(title),
        listRowBackground('clear'),
        // 6pt above and below: a 12pt gap between stacked sign-in buttons.
        listRowInsets({ top: 6, leading: 0, bottom: 6, trailing: 0 }),
        listRowSeparator('hidden'),
      ]}
    >
      <HStack
        spacing={10}
        modifiers={[
          // Keeps the logo and a shrunk title off the pill's rounded ends.
          padding({ horizontal: 16 }),
          frame({ maxWidth: Infinity, minHeight: height }),
          background(colors.fill, shapes.capsule()),
          strokeBorder({ content: colors.stroke, shape: 'capsule' }),
        ]}
      >
        {logoUri ? (
          <Image
            uiImage={logoUri}
            modifiers={[
              resizable(),
              frame({ width: logoSize, height: logoSize }),
              accessibilityHidden(true),
            ]}
          />
        ) : null}
        <Text
          modifiers={[
            font({ textStyle: 'body', weight: 'medium' }),
            foregroundStyle(colors.text),
            lineLimit(1),
            minimumScaleFactor(0.5),
          ]}
        >
          {title}
        </Text>
      </HStack>
    </Button>
  );
}
