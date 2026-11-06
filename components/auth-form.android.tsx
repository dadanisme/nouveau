import {
  Column,
  Row,
  Text,
  TextButton,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxSize,
  fillMaxWidth,
  imePadding,
  padding,
  verticalScroll,
} from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposeHost } from '@/components/compose-host';
import type {
  AuthFormProps,
  AuthFormSectionProps,
  AuthSwitchRowProps,
} from '@/components/auth-form';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 compact metrics: 16dp side margins, applied per row (as the native-form text field
// rows do, which carry their own 16dp side and 8dp vertical padding); 24dp between groups.
const SIDE = 16;
const TOP = 24;
const ROW_GAP = 8;
const GROUP_GAP = 24;

// The system (dynamic) palette; the accent only tints, as the `primary` role (filled button,
// focused field, text buttons). `onPrimary` is its pairing: white on the accent in both themes
// (the dark palette's own onPrimary is a dark tone meant for a light primary).
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * The Login / Signup screen: a scrolling Compose column on the `surface` role with a headline,
 * supporting text, then the field and button groups. `imePadding` keeps the focused field and
 * the button above the keyboard.
 */
export function AuthForm({ title, subtitle, insetTop, children }: AuthFormProps) {
  const insets = useSafeAreaInsets();

  return (
    <ComposeHost style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <AuthSurface title={title} subtitle={subtitle} statusBarInset={insetTop ? insets.top : 0}>
        {children}
      </AuthSurface>
    </ComposeHost>
  );
}

function AuthSurface({
  title,
  subtitle,
  statusBarInset,
  children,
}: Omit<AuthFormProps, 'insetTop'> & { statusBarInset: number }) {
  const colors = useMaterialColors();

  return (
    <Column
      verticalArrangement={{ spacedBy: GROUP_GAP }}
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        // Outside the scroll viewport, so scrolled content clips below the status bar.
        padding(0, statusBarInset, 0, 0),
        imePadding(),
        verticalScroll(),
        padding(0, TOP, 0, GROUP_GAP),
      ]}
    >
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(SIDE, 0, SIDE, 0)]}>
        <Text color={colors.onSurface} style={{ typography: 'headlineMedium' }}>
          {title}
        </Text>
        <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyLarge' }}>
          {subtitle}
        </Text>
      </Column>
      {children}
    </Column>
  );
}

/** A group of fields or buttons. */
export function AuthFormSection({ title, children }: AuthFormSectionProps) {
  const colors = useMaterialColors();

  return (
    <Column verticalArrangement={{ spacedBy: ROW_GAP }} modifiers={[fillMaxWidth()]}>
      {title ? (
        <Text
          color={colors.onSurfaceVariant}
          style={{ typography: 'labelLarge' }}
          modifiers={[padding(SIDE, 0, SIDE, 0)]}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </Column>
  );
}

/** A centered "prompt + action" link between Sign In and Sign Up. */
export function AuthSwitchRow({ prompt, action, disabled, onPress }: AuthSwitchRowProps) {
  const colors = useMaterialColors();

  return (
    <Row
      horizontalArrangement="center"
      verticalAlignment="center"
      modifiers={[fillMaxWidth(), padding(SIDE, 0, SIDE, 0)]}
    >
      {prompt ? (
        <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
          {prompt}
        </Text>
      ) : null}
      <TextButton onClick={onPress} enabled={!disabled}>
        <Text>{action}</Text>
      </TextButton>
    </Row>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
