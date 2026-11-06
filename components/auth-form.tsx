import { Button, Form, Host, HStack, Section, Text, VStack } from '@expo/ui/swift-ui';
import {
  disabled,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  multilineTextAlignment,
  scrollDismissesKeyboard,
  scrollEdgeEffectStyle,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

// A row drawn straight on the grouped background: no cell, insets or separator.
const CLEAR_ROW = [
  listRowBackground('clear'),
  listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
  listRowSeparator('hidden'),
];

export type AuthFormProps = {
  /** The headline above the form. */
  title: string;
  subtitle: string;
  /**
   * Android only: pad the form below the status bar, for a screen without a header. iOS
   * respects the safe area natively.
   */
  insetTop?: boolean;
  children: React.ReactNode;
};

/**
 * The Login / Signup screen: a SwiftUI grouped `Form` under a centered title and subtitle (the
 * iOS account sign-in layout). The Form scrolls a focused field into view above the keyboard and
 * dismisses the keyboard interactively on scroll.
 */
export function AuthForm({ title, subtitle, children }: AuthFormProps) {
  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      {/* iOS 26+: blur scrolled content under the status bar and the floating back button. */}
      <Form
        modifiers={[scrollDismissesKeyboard('interactively'), scrollEdgeEffectStyle('soft', 'top')]}
      >
        <Section>
          <VStack spacing={8} modifiers={[frame({ maxWidth: Infinity }), ...CLEAR_ROW]}>
            <Text
              modifiers={[
                font({ textStyle: 'title', weight: 'bold' }),
                multilineTextAlignment('center'),
              ]}
            >
              {title}
            </Text>
            <Text
              modifiers={[
                font({ textStyle: 'body' }),
                foregroundStyle(PlatformColor('secondaryLabel')),
                multilineTextAlignment('center'),
              ]}
            >
              {subtitle}
            </Text>
          </VStack>
        </Section>
        {children}
      </Form>
    </Host>
  );
}

export type AuthFormSectionProps = {
  /** Section header, e.g. "or continue with". */
  title?: string;
  children: React.ReactNode;
};

/** A group of rows: inset grouped `Section` on iOS, a spaced column on Android. */
export function AuthFormSection({ title, children }: AuthFormSectionProps) {
  return <Section title={title}>{children}</Section>;
}

export type AuthSwitchRowProps = {
  /** e.g. "Don't have an account?"; without one, the row is the action alone. */
  prompt?: string;
  /** e.g. "Sign Up", in the accent color. */
  action: string;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * A centered "prompt + action" link between Sign In and Sign Up, on a clear row. At accessibility
 * text sizes the action sits below the prompt.
 */
export function AuthSwitchRow({
  prompt,
  action,
  disabled: isDisabled,
  onPress,
}: AuthSwitchRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const promptText = prompt ? (
    <Text
      modifiers={[
        foregroundStyle(PlatformColor('secondaryLabel')),
        multilineTextAlignment('center'),
      ]}
    >
      {prompt}
    </Text>
  ) : null;
  const actionText = (
    <Text
      modifiers={[
        font({ textStyle: 'body', weight: 'semibold' }),
        multilineTextAlignment('center'),
      ]}
    >
      {action}
    </Text>
  );

  return (
    <Button onPress={onPress} modifiers={[disabled(Boolean(isDisabled)), ...CLEAR_ROW]}>
      {isStacked ? (
        <VStack spacing={4} modifiers={[frame({ maxWidth: Infinity })]}>
          {promptText}
          {actionText}
        </VStack>
      ) : (
        <HStack spacing={4} modifiers={[frame({ maxWidth: Infinity })]}>
          {promptText}
          {actionText}
        </HStack>
      )}
    </Button>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
