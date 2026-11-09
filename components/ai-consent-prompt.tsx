import { Button, Host, Image, ScrollView, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityHidden,
  accessibilityRemoveTraits,
  background,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  frame,
  imageScale,
  multilineTextAlignment,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { FormSymbol } from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';

// The tinted circle behind the symbol at the default text size; it grows with it.
const CIRCLE_SIZE = 72;
// HIG layout: the system's 20pt side margins on iPhone.
const SIDE = 20;
// The HIG's minimum hit target, for the borderless Privacy Policy and Not Now.
const MIN_TARGET = 44;

export type AiConsentPromptProps = {
  symbol: FormSymbol;
  /** "Allow AI Processing?" */
  title: string;
  /** What is sent, to whom, and that nothing is sent before Allow. */
  body: string;
  privacyLabel: string;
  allowLabel: string;
  notNowLabel: string;
  onOpenPrivacy: () => void;
  onAllow: () => void;
  onNotNow: () => void;
  /**
   * Size to the content, for a `fitToContents` sheet (the root `(sheets)/ai-consent`), so the
   * whole disclosure and the Privacy Policy show above Allow. Ignored at accessibility text sizes,
   * where that sheet is full height and everything scrolls. Off for a screen that fills its space
   * (the prompt pushed inside the Add Transaction sheet): the text scrolls over pinned buttons.
   */
  fitContent?: boolean;
};

/**
 * The AI consent prompt (iOS, #122), built like the sign-in prompt: the sparkles in a tinted
 * circle, the question, what is sent and to whom, and a Privacy Policy link, over a large
 * prominent Allow and a borderless Not Now. With `fitContent` the host is as tall as its content
 * and the sheet fits it; filling a screen, the text scrolls above the pinned buttons. At
 * accessibility text sizes everything scrolls together.
 */
export function AiConsentPrompt(props: AiConsentPromptProps) {
  const isLargeText = useIsAccessibilityTextSize();
  const circleSize = useScaledSize(CIRCLE_SIZE);

  const intro = (
    <VStack spacing={16} modifiers={[frame({ maxWidth: Infinity })]}>
      {/* Decorative: the title says what it's about. */}
      <Image
        systemName={props.symbol.sf}
        color={ACCENT_COLOR}
        modifiers={[
          font({ textStyle: 'title' }),
          imageScale('large'),
          frame({ width: circleSize, height: circleSize }),
          background(PlatformColor('secondarySystemGroupedBackground'), shapes.circle()),
          accessibilityHidden(true),
        ]}
      />
      <Text
        modifiers={[
          font({ textStyle: 'title2', weight: 'bold' }),
          multilineTextAlignment('center'),
          accessibilityAddTraits(['isHeader']),
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
      {/* Opens in the in-app browser; read as a link, as a SwiftUI `Link` is. */}
      <Button
        onPress={props.onOpenPrivacy}
        modifiers={[
          buttonStyle('borderless'),
          accessibilityAddTraits(['isLink']),
          accessibilityRemoveTraits(['isButton']),
        ]}
      >
        <Text modifiers={[font({ textStyle: 'body' }), frame({ minHeight: MIN_TARGET })]}>
          {props.privacyLabel}
        </Text>
      </Button>
    </VStack>
  );

  const actions = (
    <VStack spacing={8}>
      <FormPrimaryButtonRow title={props.allowLabel} onPress={props.onAllow} />
      <Button
        onPress={props.onNotNow}
        modifiers={[buttonStyle('borderless'), controlSize('large')]}
      >
        <Text modifiers={[frame({ maxWidth: Infinity, minHeight: MIN_TARGET })]}>
          {props.notNowLabel}
        </Text>
      </Button>
    </VStack>
  );

  // `matchContents` is read once on mount, so each layout has its own keyed host.
  if (isLargeText) {
    return (
      <Host key="scroll" style={styles.fill} seedColor={ACCENT_COLOR}>
        <ScrollView>
          <VStack spacing={32} modifiers={[padding({ horizontal: SIDE, vertical: 24 })]}>
            {intro}
            {actions}
          </VStack>
        </ScrollView>
      </Host>
    );
  }

  if (props.fitContent) {
    return (
      <Host
        key="fit"
        matchContents={{ vertical: true }}
        style={styles.background}
        seedColor={ACCENT_COLOR}
      >
        <VStack spacing={24} modifiers={[padding({ horizontal: SIDE, top: 8, bottom: 8 })]}>
          {intro}
          {actions}
        </VStack>
      </Host>
    );
  }

  return (
    <Host key="pinned" style={styles.fill} seedColor={ACCENT_COLOR}>
      <VStack spacing={16} modifiers={[padding({ bottom: 8 })]}>
        <ScrollView>
          <VStack modifiers={[padding({ horizontal: SIDE, top: 8 })]}>{intro}</VStack>
        </ScrollView>
        <VStack modifiers={[padding({ horizontal: SIDE })]}>{actions}</VStack>
      </VStack>
    </Host>
  );
}

// The grouped background, as the other sheets' forms have, so the circle stands out on it.
const GROUPED_BACKGROUND = PlatformColor('systemGroupedBackground');

const styles = StyleSheet.create({
  background: { backgroundColor: GROUPED_BACKGROUND },
  fill: { flex: 1, backgroundColor: GROUPED_BACKGROUND },
});
