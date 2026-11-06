import { Button, Host, Image, ScrollView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityHidden,
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

export type SignInPromptProps = {
  symbol: FormSymbol;
  /** "Sign In to Scan Receipts". */
  title: string;
  body: string;
  signInLabel: string;
  notNowLabel: string;
  onSignIn: () => void;
  onNotNow: () => void;
};

/**
 * The sign-in prompt (iOS, #100): the feature's symbol in a tinted circle, its title and a line of
 * body, centered above a large prominent Sign In and a borderless Not Now. At accessibility text
 * sizes it scrolls from the top instead.
 */
export function SignInPrompt(props: SignInPromptProps) {
  const isLargeText = useIsAccessibilityTextSize();
  const circleSize = useScaledSize(CIRCLE_SIZE);

  const intro = (
    <VStack spacing={16} modifiers={[frame({ maxWidth: Infinity })]}>
      {/* Decorative: the title names the feature. */}
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
    </VStack>
  );

  const actions = (
    <VStack spacing={8}>
      <FormPrimaryButtonRow title={props.signInLabel} onPress={props.onSignIn} />
      <Button
        onPress={props.onNotNow}
        modifiers={[buttonStyle('borderless'), controlSize('large')]}
      >
        <Text modifiers={[frame({ maxWidth: Infinity, minHeight: 44 })]}>{props.notNowLabel}</Text>
      </Button>
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
  // The grouped background, as the other sheets' forms have, so the circle stands out on it.
  fill: { flex: 1, backgroundColor: PlatformColor('systemGroupedBackground') },
});
