import { Box, Icon, Row, Shape, Surface, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useColorScheme } from 'react-native';

import type { GoogleSignInButtonProps } from '@/components/google-sign-in-button';
import { GOOGLE_BUTTON_COLORS, SOCIAL_BUTTON_HEIGHT } from '@/constants/google-branding';

const HEIGHT = SOCIAL_BUTTON_HEIGHT.android;
const RADIUS = HEIGHT / 2;
const LOGO_SIZE = 20;
// The form's 16dp side margin; each row carries its own, like the native-form rows.
const SIDE = 16;
const PILL = Shape.RoundedCorner({
  cornerRadii: { topStart: RADIUS, topEnd: RADIUS, bottomStart: RADIUS, bottomEnd: RADIUS },
});

/**
 * The "Sign in with Google" button per Google's branding guidelines: the standard multicolor
 * "G" and a Roboto Medium 14sp label (`labelLarge`) on the light (or, in dark theme, dark) pill
 * with its 1dp stroke. A clickable M3 `Surface`, so it gets the platform ripple.
 */
export function GoogleSignInButton({ title, disabled, onPress }: GoogleSignInButtonProps) {
  const colors = GOOGLE_BUTTON_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <Surface
      onClick={onPress}
      enabled={!disabled}
      shape={PILL}
      color={colors.fill}
      contentColor={colors.text}
      border={{ width: 1, color: colors.stroke }}
      modifiers={[fillMaxWidth(), padding(SIDE, 0, SIDE, 0), height(HEIGHT)]}
    >
      <Box contentAlignment="center" modifiers={[fillMaxWidth(), height(HEIGHT)]}>
        <Row horizontalArrangement={{ spacedBy: 12 }} verticalAlignment="center">
          <Icon source={require('@/assets/icons/google_g.xml')} tint={null} size={LOGO_SIZE} />
          <Text color={colors.text} style={{ typography: 'labelLarge' }}>
            {title}
          </Text>
        </Row>
      </Box>
    </Surface>
  );
}
