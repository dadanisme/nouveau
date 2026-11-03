import {
  Column,
  Host,
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

import type {
  AuthFormProps,
  AuthFormSectionProps,
  AuthSwitchRowProps,
} from '@/components/auth-form';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 form metrics: 24dp side margins, 16dp between fields, 24dp between groups.
const SIDE = 24;
const TOP = 24;
const FIELD_GAP = 16;
const GROUP_GAP = 24;

// The system (dynamic) palette; the accent only tints, as the `primary` role (filled button,
// focused field, text buttons).
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

/**
 * The Login / Signup screen: a scrolling Compose column on the `surface` role with a headline,
 * supporting text, then the field and button groups. `imePadding` keeps the focused field and
 * the button above the keyboard.
 */
export function AuthForm({ title, subtitle, insetTop, children }: AuthFormProps) {
  const insets = useSafeAreaInsets();

  return (
    <Host style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <AuthSurface title={title} subtitle={subtitle} top={TOP + (insetTop ? insets.top : 0)}>
        {children}
      </AuthSurface>
    </Host>
  );
}

function AuthSurface({
  title,
  subtitle,
  top,
  children,
}: Omit<AuthFormProps, 'insetTop'> & { top: number }) {
  const colors = useMaterialColors();

  return (
    <Column
      verticalArrangement={{ spacedBy: GROUP_GAP }}
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        imePadding(),
        verticalScroll(),
        padding(SIDE, top, SIDE, GROUP_GAP),
      ]}
    >
      <Column verticalArrangement={{ spacedBy: 8 }}>
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

/** A group of fields or buttons, spaced as M3 form fields. */
export function AuthFormSection({ title, children }: AuthFormSectionProps) {
  const colors = useMaterialColors();

  return (
    <Column verticalArrangement={{ spacedBy: FIELD_GAP }} modifiers={[fillMaxWidth()]}>
      {title ? (
        <Text color={colors.onSurfaceVariant} style={{ typography: 'labelLarge' }}>
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
    <Row horizontalArrangement="center" verticalAlignment="center" modifiers={[fillMaxWidth()]}>
      <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
        {prompt}
      </Text>
      <TextButton onClick={onPress} enabled={!disabled}>
        <Text>{action}</Text>
      </TextButton>
    </Row>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
