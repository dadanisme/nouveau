import {
  Button,
  ContentUnavailableView,
  ContextMenu,
  Form,
  Host,
  HStack,
  Image,
  Label,
  Picker,
  ProgressView,
  SecureField,
  RNHostView,
  Section,
  Spacer,
  SwipeActions,
  Text,
  TextField,
  useNativeState,
  VStack,
  type SecureFieldRef,
  type TextFieldRef,
} from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityLabel,
  autocorrectionDisabled,
  badge,
  disabled,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  keyboardType,
  labelsHidden,
  lineLimit,
  listRowBackground,
  onSubmit as onSubmitModifier,
  monospacedDigit,
  pickerStyle,
  refreshable,
  scrollDismissesKeyboard,
  submitLabel as submitLabelModifier,
  tag,
  textContentType,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useEffect, useImperativeHandle, useRef } from 'react';
import { PlatformColor, StyleSheet } from 'react-native';

import type {
  FormButtonRowProps,
  FormEmptyRowProps,
  FormHostedRowProps,
  FormListRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
  FormRowAction,
  FormProgressRowProps,
  FormSectionProps,
  FormSegmentedRowProps,
  FormTextFieldContentType,
  FormTextFieldRowProps,
  FormValueRowProps,
  NativeFormProps,
} from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
const TERTIARY = foregroundStyle(PlatformColor('tertiaryLabel'));

// Leading glyph box, so titles line up and rows keep one height whatever the symbol's shape.
const SYMBOL_WIDTH = 28;

/**
 * A full-screen SwiftUI grouped `Form` (inset grouped list). Render it as the screen's root so
 * the native Stack header's large title collapses with its scroll. iOS sheets name themselves in
 * their native header, so `title` (an Android sheet heading) isn't drawn here.
 */
export function NativeForm({ onRefresh, dismissesKeyboardOnScroll, children }: NativeFormProps) {
  const modifiers = [
    ...(onRefresh ? [refreshable(onRefresh)] : []),
    ...(dismissesKeyboardOnScroll ? [scrollDismissesKeyboard('interactively')] : []),
  ];

  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      <Form modifiers={modifiers.length ? modifiers : undefined}>{children}</Form>
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
      modifiers={[disabled(isDisabled ?? false)]}
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

/** An action list for a row: `actions`, then the `onDelete` shorthand. */
function rowActions({
  actions,
  onDelete,
  deleteLabel,
}: Pick<FormListRowProps, 'actions' | 'onDelete' | 'deleteLabel'>): FormRowAction[] {
  const all = [...(actions ?? [])];
  if (onDelete) {
    all.push({
      title: deleteLabel ?? '',
      role: 'destructive',
      icon: { sf: 'trash', md: require('@/assets/icons/delete.xml') },
      onPress: onDelete,
    });
  }
  return all;
}

/**
 * The generic list row (see `FormListRowProps`): leading symbol/icon, title and subtitle, value,
 * then a chevron (tappable) or checkmark (`selected`). Actions become trailing swipe actions (a
 * full swipe runs the first) and a long-press context menu.
 */
export function FormListRow({
  title,
  subtitle,
  icon,
  symbol,
  value,
  selected,
  onPress,
  actions,
  onDelete,
  deleteLabel,
}: FormListRowProps) {
  const titleView = subtitle ? (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[PRIMARY]}>{title}</Text>
      <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{subtitle}</Text>
    </VStack>
  ) : (
    <Text modifiers={[PRIMARY]}>{title}</Text>
  );

  const content = (
    <HStack spacing={12}>
      {symbol ? (
        <Image
          systemName={symbol.sf}
          color={symbol.color}
          modifiers={[frame({ width: SYMBOL_WIDTH, height: SYMBOL_WIDTH })]}
        />
      ) : null}
      {icon && !symbol ? <Label systemImage={icon.sf}>{titleView}</Label> : titleView}
      <Spacer />
      {value ? <Text modifiers={[SECONDARY]}>{value}</Text> : null}
      {selected ? (
        <Image
          systemName="checkmark"
          modifiers={[
            font({ textStyle: 'body', weight: 'semibold' }),
            foregroundStyle(ACCENT_COLOR),
          ]}
        />
      ) : null}
      {onPress && selected === undefined ? (
        <Image
          systemName="chevron.right"
          modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY]}
        />
      ) : null}
    </HStack>
  );

  const row = onPress ? (
    <Button
      onPress={onPress}
      modifiers={selected ? [accessibilityAddTraits(['isSelected'])] : undefined}
    >
      {content}
    </Button>
  ) : (
    content
  );

  const all = rowActions({ actions, onDelete, deleteLabel });
  if (!all.length) return row;

  return (
    <SwipeActions>
      <ContextMenu>
        <ContextMenu.Trigger>{row}</ContextMenu.Trigger>
        <ContextMenu.Items>
          {all.map((action) => (
            <Button
              key={action.title}
              role={action.role === 'destructive' ? 'destructive' : 'default'}
              label={action.title}
              systemImage={action.icon?.sf}
              onPress={action.onPress}
            />
          ))}
        </ContextMenu.Items>
      </ContextMenu>
      {/* Not `role="destructive"`: SwiftUI removes a destructive swipe row optimistically, before
          the confirmation, and Cancel can't bring it back. A red tint keeps the destructive look
          (the Host's accent tint would otherwise fill it orange). */}
      <SwipeActions.Actions edge="trailing">
        {all.map((action) => (
          <Button
            key={action.title}
            label={action.title}
            systemImage={action.icon?.sf}
            onPress={action.onPress}
            modifiers={
              action.role === 'destructive' ? [tint(PlatformColor('systemRed'))] : undefined
            }
          />
        ))}
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

const IOS_CONTENT_TYPE = {
  emailAddress: 'emailAddress',
  username: 'username',
  newUsername: 'username',
  password: 'password',
  newPassword: 'newPassword',
} as const satisfies Record<FormTextFieldContentType, string>;

/** A single-line text field row (see `FormTextFieldRowProps`). */
export function FormTextFieldRow({
  ref,
  placeholder,
  label,
  value,
  defaultValue = '',
  onChangeText,
  keyboard = 'default',
  secure,
  contentType,
  autoCapitalize,
  autoFocus,
  maxLength,
  submitLabel,
  onSubmit,
  disabled: isDisabled,
}: FormTextFieldRowProps) {
  const initial = value ?? defaultValue;
  const text = useNativeState(initial);
  // The last text the field reported, so only outside `value` changes are written back to it.
  const lastText = useRef(initial);
  const textField = useRef<TextFieldRef>(null);
  const secureField = useRef<SecureFieldRef>(null);

  useImperativeHandle(
    ref,
    () => ({ focus: () => void (textField.current ?? secureField.current)?.focus() }),
    [],
  );

  useEffect(() => {
    if (value === undefined || value === lastText.current) return;
    lastText.current = value;
    text.set(value);
  }, [value, text]);

  const isEmail = keyboard === 'email';
  const isPlain = isEmail || secure;
  const capitalization = autoCapitalize ?? (isPlain ? 'none' : 'sentences');
  const autofill = contentType ?? (isEmail ? 'emailAddress' : undefined);

  const handleTextChange = (next: string) => {
    lastText.current = next;
    onChangeText(next);
  };
  const modifiers = [
    accessibilityLabel(label ?? placeholder),
    textInputAutocapitalization(capitalization === 'none' ? 'never' : capitalization),
    ...(isPlain ? [autocorrectionDisabled(true)] : []),
    ...(isEmail ? [keyboardType('email-address')] : []),
    ...(autofill ? [textContentType(IOS_CONTENT_TYPE[autofill])] : []),
    ...(submitLabel ? [submitLabelModifier(submitLabel)] : []),
    ...(onSubmit ? [onSubmitModifier(onSubmit)] : []),
    disabled(isDisabled ?? false),
  ];

  if (secure) {
    return (
      <SecureField
        ref={secureField}
        text={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onTextChange={handleTextChange}
        modifiers={modifiers}
      />
    );
  }

  return (
    <TextField
      ref={textField}
      text={text}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength}
      onTextChange={handleTextChange}
      modifiers={modifiers}
    />
  );
}

/** A full-width segmented control (`Picker` with the segmented style). */
export function FormSegmentedRow<T extends string>({
  label,
  options,
  selection,
  onSelectionChange,
}: FormSegmentedRowProps<T>) {
  return (
    <Picker<T>
      label={label}
      selection={selection}
      onSelectionChange={onSelectionChange}
      modifiers={[pickerStyle('segmented'), labelsHidden(), accessibilityLabel(label)]}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}

/** A read-only label/value row (e.g. a total); a positive value reads in the system green. */
export function FormValueRow({ title, value, tone = 'default', emphasized }: FormValueRowProps) {
  const weight = emphasized ? 'semibold' : undefined;
  return (
    <HStack>
      <Text modifiers={[PRIMARY, font({ textStyle: 'body', weight })]}>{title}</Text>
      <Spacer />
      <Text
        modifiers={[
          foregroundStyle(PlatformColor(tone === 'positive' ? 'systemGreen' : 'label')),
          font({ textStyle: 'body', weight }),
          monospacedDigit(),
        ]}
      >
        {value}
      </Text>
    </HStack>
  );
}

/** A row with a symbol, title, trailing value and a linear `ProgressView` in the symbol's color. */
export function FormProgressRow({ title, symbol, value, progress, onPress }: FormProgressRowProps) {
  const content = (
    <VStack alignment="leading" spacing={8}>
      <HStack spacing={12}>
        {symbol ? (
          <Image
            systemName={symbol.sf}
            color={symbol.color}
            modifiers={[frame({ width: SYMBOL_WIDTH, height: SYMBOL_WIDTH })]}
          />
        ) : null}
        {/* Fills the row instead of a Spacer, whose minimum length and extra stack spacing would
            cost the title ~20pt and truncate names that fit. */}
        <Text
          modifiers={[PRIMARY, lineLimit(1), frame({ maxWidth: Infinity, alignment: 'leading' })]}
        >
          {title}
        </Text>
        {/* Its ideal width, on one line: the title truncates first, and only when space runs out. */}
        <Text
          modifiers={[SECONDARY, monospacedDigit(), lineLimit(1), fixedSize({ horizontal: true })]}
        >
          {value}
        </Text>
        {onPress ? (
          <Image
            systemName="chevron.right"
            modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY]}
          />
        ) : null}
      </HStack>
      <ProgressView
        value={Math.min(Math.max(progress, 0), 1)}
        modifiers={symbol?.color ? [tint(symbol.color)] : undefined}
      />
    </VStack>
  );

  return onPress ? <Button onPress={onPress}>{content}</Button> : content;
}

/** A row hosting a React Native view: full row width, the view's own height. */
export function FormHostedRow({ children }: FormHostedRowProps) {
  return <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>;
}

/** An empty state (`ContentUnavailableView`) on a clear row. */
export function FormEmptyRow({ title, description, symbol }: FormEmptyRowProps) {
  return (
    <ContentUnavailableView
      title={title}
      systemImage={symbol.sf}
      description={description}
      modifiers={[listRowBackground('clear')]}
    />
  );
}

/** A centered activity indicator on a clear row. */
export function FormLoadingRow() {
  return (
    <HStack modifiers={[listRowBackground('clear')]}>
      <Spacer />
      <ProgressView />
      <Spacer />
    </HStack>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
