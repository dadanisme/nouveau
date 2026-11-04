import {
  Button,
  ContentUnavailableView,
  ContextMenu,
  Form,
  Host,
  HStack,
  Image,
  Label,
  Menu,
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
  accessibilityValue,
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
  multilineTextAlignment,
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
  FormIcon,
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
import { RowSymbol } from '@/components/row-symbol';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
const TERTIARY = foregroundStyle(PlatformColor('tertiaryLabel'));
const DESTRUCTIVE_TINT = tint(PlatformColor('systemRed'));

// At accessibility text sizes rows stack: the title on top, its value and other secondary items
// below, left-aligned, and nothing truncates (HIG typography, Supporting Dynamic Type).

/** A row's `Label` icon on its own line, for the stacked layout: the accent tint, body size. */
function StackedIcon({ icon }: { icon: FormIcon }) {
  return (
    <Image
      systemName={icon.sf}
      modifiers={[font({ textStyle: 'body' }), foregroundStyle(ACCENT_COLOR)]}
    />
  );
}

function Chevron() {
  return (
    <Image
      systemName="chevron.right"
      modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY]}
    />
  );
}

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
  const isStacked = useIsAccessibilityTextSize();
  const label = (
    <Label systemImage={icon?.sf}>
      <Text modifiers={[PRIMARY]}>{title}</Text>
    </Label>
  );
  const valueText = value ? <Text modifiers={[SECONDARY]}>{value}</Text> : null;

  return (
    <Button onPress={onPress} modifiers={count ? [badge(String(count))] : undefined}>
      {isStacked ? (
        <HStack>
          {/* The icon on its own line: beside the text it would leave words room to hyphenate only. */}
          <VStack alignment="leading" spacing={4}>
            {icon ? <StackedIcon icon={icon} /> : null}
            <Text modifiers={[PRIMARY]}>{title}</Text>
            {valueText}
          </VStack>
          <Spacer />
          <Chevron />
        </HStack>
      ) : (
        <HStack>
          {label}
          <Spacer />
          {valueText}
          <Chevron />
        </HStack>
      )}
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
  const isStacked = useIsAccessibilityTextSize();
  const label = <Label title={title} systemImage={icon?.sf} />;
  const optionViews = options.map((option) => (
    <Text key={option.value} modifiers={[tag(option.value)]}>
      {option.label}
    </Text>
  ));

  // Stacked, the row is a menu whose label is the icon, the title and the current option on their
  // own lines, with the picker inside it. One button then names the row for VoiceOver ("Language,
  // English"): beside a labels-hidden `Picker`, the visible title was a second element that
  // `accessibilityHidden` doesn't remove from a form row.
  if (isStacked) {
    const current = options.find((option) => option.value === selection)?.label ?? '';
    return (
      <Menu
        label={
          // A menu label centers wrapped lines; the row reads left-aligned like the others.
          <VStack alignment="leading" spacing={4} modifiers={[multilineTextAlignment('leading')]}>
            {icon ? <StackedIcon icon={icon} /> : null}
            <Text modifiers={[PRIMARY]}>{title}</Text>
            <HStack spacing={4}>
              <Text>{current}</Text>
              <Image
                systemName="chevron.up.chevron.down"
                modifiers={[font({ textStyle: 'footnote', weight: 'semibold' })]}
              />
            </HStack>
          </VStack>
        }
        modifiers={[accessibilityLabel(title), accessibilityValue(current)]}
      >
        <Picker<T>
          label={title}
          selection={selection}
          onSelectionChange={onSelectionChange}
          modifiers={[pickerStyle('inline')]}
        >
          {optionViews}
        </Picker>
      </Menu>
    );
  }

  return (
    <Picker<T> label={label} selection={selection} onSelectionChange={onSelectionChange}>
      {optionViews}
    </Picker>
  );
}

/**
 * A centered action row (e.g. Sign Out). While `pending`, it's disabled and shows an activity
 * indicator beside its (in-progress) title.
 */
export function FormButtonRow({
  title,
  role,
  disabled: isDisabled,
  pending,
  onPress,
}: FormButtonRowProps) {
  return (
    <Button
      role={role === 'destructive' ? 'destructive' : 'default'}
      onPress={onPress}
      modifiers={[disabled(Boolean(isDisabled || pending))]}
    >
      <HStack spacing={8}>
        <Spacer />
        {pending ? <ProgressView /> : null}
        <Text modifiers={[multilineTextAlignment('center')]}>{title}</Text>
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
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
}: FormListRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const valueText = value ? <Text modifiers={[SECONDARY]}>{value}</Text> : null;
  const titleView =
    subtitle || (isStacked && valueText) ? (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[PRIMARY]}>{title}</Text>
        {subtitle ? (
          <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{subtitle}</Text>
        ) : null}
        {isStacked ? valueText : null}
      </VStack>
    ) : (
      <Text modifiers={[PRIMARY]}>{title}</Text>
    );
  const leading = icon && !symbol ? <Label systemImage={icon.sf}>{titleView}</Label> : titleView;

  const content = (
    <HStack spacing={12}>
      {/* Stacked, the symbol or icon sits above the text so the text keeps the row's full width
          (a `Label` would center a multi-line title beside its icon). */}
      {isStacked && (symbol || icon) ? (
        <VStack alignment="leading" spacing={4}>
          {symbol ? <RowSymbol symbol={symbol} /> : icon ? <StackedIcon icon={icon} /> : null}
          {titleView}
        </VStack>
      ) : (
        <>
          {symbol ? <RowSymbol symbol={symbol} /> : null}
          {leading}
        </>
      )}
      <Spacer />
      {isStacked ? null : valueText}
      {selected ? (
        <Image
          systemName="checkmark"
          modifiers={[
            font({ textStyle: 'body', weight: 'semibold' }),
            foregroundStyle(ACCENT_COLOR),
          ]}
        />
      ) : null}
      {onPress && selected === undefined ? <Chevron /> : null}
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
          {onEdit ? <Button label={editLabel ?? ''} systemImage="pencil" onPress={onEdit} /> : null}
          {all.map((action) => (
            <Button
              key={action.title}
              role={action.role === 'destructive' ? 'destructive' : 'default'}
              label={action.title}
              systemImage={action.icon?.sf}
              onPress={action.onPress}
              // The Host's accent tint would otherwise paint a destructive item's icon orange.
              modifiers={action.role === 'destructive' ? [DESTRUCTIVE_TINT] : undefined}
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
            modifiers={action.role === 'destructive' ? [DESTRUCTIVE_TINT] : undefined}
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
  const isStacked = useIsAccessibilityTextSize();
  const weight = emphasized ? 'semibold' : undefined;
  const titleText = <Text modifiers={[PRIMARY, font({ textStyle: 'body', weight })]}>{title}</Text>;
  const valueText = (
    <Text
      modifiers={[
        foregroundStyle(PlatformColor(tone === 'positive' ? 'systemGreen' : 'label')),
        font({ textStyle: 'body', weight }),
        monospacedDigit(),
      ]}
    >
      {value}
    </Text>
  );

  if (isStacked) {
    return (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}
      >
        {titleText}
        {valueText}
      </VStack>
    );
  }
  return (
    <HStack>
      {titleText}
      <Spacer />
      {valueText}
    </HStack>
  );
}

/** A row with a symbol, title, trailing value and a linear `ProgressView` in the symbol's color. */
export function FormProgressRow({ title, symbol, value, progress, onPress }: FormProgressRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const bar = (
    <ProgressView
      value={Math.min(Math.max(progress, 0), 1)}
      modifiers={symbol?.color ? [tint(symbol.color)] : undefined}
    />
  );

  const content = isStacked ? (
    <HStack spacing={12}>
      <VStack alignment="leading" spacing={4}>
        {symbol ? <RowSymbol symbol={symbol} /> : null}
        <Text modifiers={[PRIMARY]}>{title}</Text>
        <Text modifiers={[SECONDARY, monospacedDigit()]}>{value}</Text>
        {bar}
      </VStack>
      {onPress ? <Chevron /> : null}
    </HStack>
  ) : (
    <VStack alignment="leading" spacing={8}>
      <HStack spacing={12}>
        {symbol ? <RowSymbol symbol={symbol} /> : null}
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
        {onPress ? <Chevron /> : null}
      </HStack>
      {bar}
    </VStack>
  );

  return onPress ? <Button onPress={onPress}>{content}</Button> : content;
}

/** A row hosting a React Native view: full row width, the view's own height. */
export function FormHostedRow({ children }: FormHostedRowProps) {
  return <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>;
}

/**
 * An empty state (`ContentUnavailableView`) on a clear row. Its ideal height, so a long title wraps
 * instead of truncating (the row otherwise proposes one line to it on iOS 18 and at AX sizes).
 */
export function FormEmptyRow({ title, description, symbol }: FormEmptyRowProps) {
  return (
    <ContentUnavailableView
      title={title}
      systemImage={symbol.sf}
      description={description}
      modifiers={[listRowBackground('clear'), fixedSize({ horizontal: false, vertical: true })]}
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
