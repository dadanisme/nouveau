import { Button, Form, Host, HStack, Section, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityLabel,
  accessibilityRemoveTraits,
  buttonStyle,
  contentShape,
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
  shapes,
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

// HIG accessibility: "a minimum control size of 44x44 pt", for the link row outside a Form too.
const MIN_TARGET = 44;
// The whole row takes the tap, not only its glyphs.
const ROW_SHAPE = contentShape(shapes.rectangle());

export type AuthFormProps = {
  /** The headline above the form. */
  title: string;
  subtitle: string;
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

/**
 * A group of rows: inset grouped `Section` on iOS, a spaced column on Android. The header ("or
 * continue with") is centered over the centered buttons; as a header view it keeps the system
 * header font, color and capitalization.
 */
export function AuthFormSection({ title, children }: AuthFormSectionProps) {
  const header = title ? (
    <Text
      modifiers={[
        frame({ maxWidth: Infinity, alignment: 'center' }),
        multilineTextAlignment('center'),
      ]}
    >
      {title}
    </Text>
  ) : undefined;
  return <Section header={header}>{children}</Section>;
}

export type AuthSwitchRowProps = {
  /** e.g. "Don't have an account?"; without one, the row is the action alone. */
  prompt?: string;
  /** e.g. "Sign Up", in the accent color. */
  action: string;
  /** What VoiceOver / TalkBack say for the row; unset, the prompt and action both read. */
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * A centered "prompt + action" link (between Sign In and Sign Up, Welcome's Sign In), on a clear
 * row at least 44pt tall, so it works in a Form and on its own. At accessibility text sizes the
 * action sits below the prompt.
 */
export function AuthSwitchRow({
  prompt,
  action,
  accessibilityLabel: label,
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
    <Button
      onPress={onPress}
      modifiers={[
        disabled(Boolean(isDisabled)),
        ...CLEAR_ROW,
        ...(label ? [accessibilityLabel(label)] : []),
      ]}
    >
      {isStacked ? (
        <VStack
          spacing={4}
          modifiers={[frame({ maxWidth: Infinity, minHeight: MIN_TARGET }), ROW_SHAPE]}
        >
          {promptText}
          {actionText}
        </VStack>
      ) : (
        <HStack
          spacing={4}
          modifiers={[frame({ maxWidth: Infinity, minHeight: MIN_TARGET }), ROW_SHAPE]}
        >
          {promptText}
          {actionText}
        </HStack>
      )}
    </Button>
  );
}

export type AuthLegalFooterProps = {
  /** e.g. "By signing up, you agree to the Terms of Use and Privacy Policy." */
  text: string;
  termsLabel: string;
  privacyLabel: string;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
};

/**
 * The agreement line under the sign-up / sign-in actions (#81): a centered footnote, then the
 * Terms of Use and Privacy Policy as two links that open in the in-app browser, on the grouped
 * background like the paywall's footer. Separate 44pt links rather than inline Markdown ones: a
 * Markdown link in a SwiftUI `Text` hands the URL to Safari and is only as tall as its text.
 */
export function AuthLegalFooter({
  text,
  termsLabel,
  privacyLabel,
  onOpenTerms,
  onOpenPrivacy,
}: AuthLegalFooterProps) {
  const isStacked = useIsAccessibilityTextSize();
  const terms = <LegalLink title={termsLabel} onPress={onOpenTerms} />;
  const privacy = <LegalLink title={privacyLabel} onPress={onOpenPrivacy} />;

  return (
    <Section>
      <VStack spacing={4} modifiers={[frame({ maxWidth: Infinity }), ...CLEAR_ROW]}>
        <Text
          modifiers={[
            font({ textStyle: 'footnote' }),
            foregroundStyle(PlatformColor('secondaryLabel')),
            multilineTextAlignment('center'),
          ]}
        >
          {text}
        </Text>
        {isStacked ? (
          <VStack spacing={4}>
            {terms}
            {privacy}
          </VStack>
        ) : (
          <HStack spacing={20}>
            {terms}
            {privacy}
          </HStack>
        )}
      </VStack>
    </Section>
  );
}

/**
 * A footnote link at least 44pt tall. Borderless, so each takes its own taps inside the one form
 * row; read as a link, as a SwiftUI `Link` is.
 */
function LegalLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle('borderless'),
        accessibilityAddTraits(['isLink']),
        accessibilityRemoveTraits(['isButton']),
      ]}
    >
      <Text
        modifiers={[
          font({ textStyle: 'footnote' }),
          multilineTextAlignment('center'),
          frame({ minHeight: MIN_TARGET }),
          ROW_SHAPE,
        ]}
      >
        {title}
      </Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
