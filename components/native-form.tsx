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
  Section,
  Spacer,
  SwipeActions,
  Text,
  TextField,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityLabel,
  autocorrectionDisabled,
  background,
  badge,
  disabled,
  font,
  foregroundStyle,
  frame,
  keyboardType,
  labelsHidden,
  listRowBackground,
  onSubmit as onSubmitModifier,
  padding,
  pickerStyle,
  refreshable,
  submitLabel as submitLabelModifier,
  tag,
  textContentType,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useEffect, useRef } from 'react';
import { PlatformColor, StyleSheet } from 'react-native';

import type {
  FormButtonRowProps,
  FormEmptyRowProps,
  FormListRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
  FormRowAction,
  FormSectionProps,
  FormSegmentedRowProps,
  FormTextFieldRowProps,
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
 * the native Stack header's large title collapses with its scroll. With `title` (sheets without a
 * header), a headline sits above the form on the grouped background.
 */
export function NativeForm({ title, onRefresh, children }: NativeFormProps) {
  const form = <Form modifiers={onRefresh ? [refreshable(onRefresh)] : undefined}>{children}</Form>;

  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      {title ? (
        <VStack
          spacing={0}
          modifiers={[
            background(PlatformColor('systemGroupedBackground'), { ignoresSafeAreaEdges: 'all' }),
          ]}
        >
          <Text
            modifiers={[
              font({ textStyle: 'headline' }),
              padding({ top: 20, bottom: 4 }),
              accessibilityAddTraits(['isHeader']),
            ]}
          >
            {title}
          </Text>
          {form}
        </VStack>
      ) : (
        form
      )}
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

/** A single-line text field row (see `FormTextFieldRowProps`). */
export function FormTextFieldRow({
  placeholder,
  label,
  value,
  defaultValue = '',
  onChangeText,
  keyboard = 'default',
  autoCapitalize,
  autoFocus,
  maxLength,
  submitLabel,
  onSubmit,
}: FormTextFieldRowProps) {
  const initial = value ?? defaultValue;
  const text = useNativeState(initial);
  // The last text the field reported, so only outside `value` changes are written back to it.
  const lastText = useRef(initial);

  useEffect(() => {
    if (value === undefined || value === lastText.current) return;
    lastText.current = value;
    text.set(value);
  }, [value, text]);

  const isEmail = keyboard === 'email';
  const capitalization = autoCapitalize ?? (isEmail ? 'none' : 'sentences');

  return (
    <TextField
      text={text}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength}
      onTextChange={(next) => {
        lastText.current = next;
        onChangeText(next);
      }}
      modifiers={[
        ...(label ? [accessibilityLabel(label)] : []),
        textInputAutocapitalization(capitalization === 'none' ? 'never' : capitalization),
        ...(isEmail
          ? [
              keyboardType('email-address'),
              textContentType('emailAddress'),
              autocorrectionDisabled(true),
            ]
          : []),
        ...(submitLabel ? [submitLabelModifier(submitLabel)] : []),
        ...(onSubmit ? [onSubmitModifier(onSubmit)] : []),
      ]}
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
