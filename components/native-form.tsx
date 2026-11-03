import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  Label,
  Picker,
  Section,
  Spacer,
  Text,
} from '@expo/ui/swift-ui';
import { badge, disabled, font, foregroundStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import type {
  FormButtonRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
  FormSectionProps,
  NativeFormProps,
} from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
const TERTIARY = foregroundStyle(PlatformColor('tertiaryLabel'));

/**
 * A full-screen SwiftUI grouped `Form` (inset grouped list). Render it as the screen's root so
 * the native Stack header's large title collapses with its scroll.
 */
export function NativeForm({ children }: NativeFormProps) {
  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      <Form>{children}</Form>
    </Host>
  );
}

export function FormSection({ title, footer, children }: FormSectionProps) {
  return (
    <Section title={title} footer={footer ? <Text>{footer}</Text> : undefined}>
      {children}
    </Section>
  );
}

/** A row that pushes a screen or presents a sheet: label, optional value, chevron. */
export function FormNavRow({ title, icon, value, badge: count, onPress }: FormNavRowProps) {
  return (
    <Button onPress={onPress} modifiers={count ? [badge(String(count))] : undefined}>
      <HStack>
        <Label systemImage={icon?.sf}>
          <Text modifiers={[PRIMARY]}>{title}</Text>
        </Label>
        <Spacer />
        {value ? <Text modifiers={[SECONDARY]}>{value}</Text> : null}
        <Image
          systemName="chevron.right"
          modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY]}
        />
      </HStack>
    </Button>
  );
}

/** An inline menu picker; the current option shows trailing. */
export function FormPickerRow<T extends string>({
  title,
  icon,
  options,
  selection,
  onSelectionChange,
}: FormPickerRowProps<T>) {
  return (
    <Picker<T>
      label={<Label title={title} systemImage={icon?.sf} />}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}

/** A centered action row (e.g. Sign Out). */
export function FormButtonRow({ title, role, disabled: isDisabled, onPress }: FormButtonRowProps) {
  return (
    <Button
      role={role === 'destructive' ? 'destructive' : 'default'}
      onPress={onPress}
      modifiers={[disabled(isDisabled)]}
    >
      <HStack>
        <Spacer />
        <Text>{title}</Text>
        <Spacer />
      </HStack>
    </Button>
  );
}

export function FormNoticeRow({ text, icon }: FormNoticeRowProps) {
  return (
    <Label title={text} systemImage={icon?.sf} modifiers={[font({ textStyle: 'footnote' })]} />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
