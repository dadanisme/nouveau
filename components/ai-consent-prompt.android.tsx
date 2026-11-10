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
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AiConsentPromptProps } from '@/components/ai-consent-prompt';
import { ComposeHost } from '@/components/compose-host';
import { ComposeSymbolIcon } from '@/components/compose-symbol-icon';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

// Material 3 compact metrics, as in the sign-in prompt: 24dp side margins for the text, 16dp under
// the actions (the buttons carry their own 16dp side padding), the 48dp touch target for the text
// buttons.
const SIDE = 24;
const TOP = 24;
const BOTTOM = 16;
const CIRCLE_SIZE = 72;
const ICON_SIZE = 36;
const BUTTON_HEIGHT = 48;

// The system (dynamic) palette; the accent only tints, as the `primary` role (the symbol, the
// filled Allow, the text buttons). `onPrimary` is its pairing: white on the accent.
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * The AI consent prompt (Android, #122), in a headerless form sheet: the sparkles in a tinted
 * circle, the headline, what is sent and to whom, and a Privacy policy text button, above a
 * full-width M3 filled Allow and a Not now text button. With `fitContent` (and below the
 * accessibility text sizes) the host is as tall as its content and the sheet fits it; otherwise it
 * fills the sheet and the text scrolls above the pinned buttons.
 */
export function AiConsentPrompt(props: AiConsentPromptProps) {
  const isLargeText = useIsAccessibilityTextSize();
  const fit = props.fitContent === true && !isLargeText;

  // `matchContents` is read once on mount, so each layout has its own keyed host.
  return fit ? (
    <ComposeHost key="fit" matchContents={{ vertical: true }} colorOverrides={COLOR_OVERRIDES}>
      <PromptSurface {...props} fit />
    </ComposeHost>
  ) : (
    <ComposeHost key="fill" style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <PromptSurface {...props} fit={false} />
    </ComposeHost>
  );
}

function PromptSurface({ fit, ...props }: AiConsentPromptProps & { fit: boolean }) {
  const colors = useMaterialColors();
  const insets = useSafeAreaInsets();

  return (
    <Column
      modifiers={[
        fit ? fillMaxWidth() : fillMaxSize(),
        background(colors.surface),
        padding(0, 0, 0, insets.bottom + BOTTOM),
      ]}
    >
      {/* Measured at its own height when fitting: a vertical scroll there would get an unbounded
          height to scroll in. */}
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 16 }}
        modifiers={
          fit
            ? [fillMaxWidth(), padding(0, TOP, 0, 8)]
            : [fillMaxWidth(), weight(1), verticalScroll(), padding(0, TOP, 0, 8)]
        }
      >
        <Box
          contentAlignment="center"
          modifiers={[
            size(CIRCLE_SIZE, CIRCLE_SIZE),
            clip(Shapes.Circle),
            background(colors.surfaceContainerHighest),
          ]}
        >
          {/* Decorative: the headline says what it's about. */}
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
          modifiers={[padding(SIDE, 0, SIDE, 0)]}
        >
          {props.body}
        </Text>
        <TextButton onClick={props.onOpenPrivacy} modifiers={[height(BUTTON_HEIGHT)]}>
          <Text>{props.privacyLabel}</Text>
        </TextButton>
      </Column>
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
        <FormPrimaryButtonRow title={props.allowLabel} onPress={props.onAllow} />
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
