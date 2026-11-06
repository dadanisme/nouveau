import {
  Box,
  Column,
  Text,
  TextButton,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  size,
  verticalScroll,
} from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposeHost } from '@/components/compose-host';
import { ComposeSymbolIcon } from '@/components/compose-symbol-icon';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { SignInPromptProps } from '@/components/sign-in-prompt';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 compact metrics: 24dp side margins for the text, 16dp under the actions (the
// buttons carry their own 16dp side padding), the 48dp touch target for Not now.
const SIDE = 24;
const TOP = 24;
const BOTTOM = 16;
const CIRCLE_SIZE = 72;
const ICON_SIZE = 36;
const BUTTON_HEIGHT = 48;

// The system (dynamic) palette; the accent only tints, as the `primary` role (the symbol, the
// filled Sign in, the Not now text button). `onPrimary` is its pairing: white on the accent.
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * The sign-in prompt (Android, #100), in a headerless form sheet: the feature's symbol in a tinted
 * circle, its headline and supporting text, then a full-width M3 filled Sign in and a Not now text
 * button. The column scrolls when large text outgrows the sheet.
 */
export function SignInPrompt(props: SignInPromptProps) {
  return (
    <ComposeHost style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <PromptSurface {...props} />
    </ComposeHost>
  );
}

function PromptSurface(props: SignInPromptProps) {
  const colors = useMaterialColors();
  const insets = useSafeAreaInsets();

  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 16 }}
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        verticalScroll(),
        padding(0, TOP, 0, insets.bottom + BOTTOM),
      ]}
    >
      <Box
        contentAlignment="center"
        modifiers={[
          size(CIRCLE_SIZE, CIRCLE_SIZE),
          clip(Shapes.Circle),
          background(colors.surfaceContainerHighest),
        ]}
      >
        {/* Decorative: the headline names the feature. */}
        <ComposeSymbolIcon
          symbol={{ ...props.symbol, color: colors.primary }}
          iconSize={ICON_SIZE}
        />
      </Box>
      <Text
        color={colors.onSurface}
        style={{ typography: 'headlineSmall', textAlign: 'center' }}
        modifiers={[padding(SIDE, 0, SIDE, 0)]}
      >
        {props.title}
      </Text>
      <Text
        color={colors.onSurfaceVariant}
        style={{ typography: 'bodyMedium', textAlign: 'center' }}
        modifiers={[padding(SIDE, 0, SIDE, 8)]}
      >
        {props.body}
      </Text>
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
        <FormPrimaryButtonRow title={props.signInLabel} onPress={props.onSignIn} />
        <TextButton
          onClick={props.onNotNow}
          modifiers={[fillMaxWidth(), padding(16, 0, 16, 0), height(BUTTON_HEIGHT)]}
        >
          <Text>{props.notNowLabel}</Text>
        </TextButton>
      </Column>
    </Column>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
