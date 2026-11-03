import {
  Button,
  ContentUnavailableView,
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
  background,
  badge,
  disabled,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  listRowBackground,
  padding,
  pickerStyle,
  refreshable,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import type {
  FormButtonRowProps,
  FormEmptyRowProps,
  FormListRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
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

/**
 * A tappable row with an optional colored symbol, value and chevron; `onDelete` adds a trailing
 * destructive swipe action (a full swipe runs it).
 */
export function FormListRow({
  title,
  symbol,
  value,
  onPress,
  onDelete,
  deleteLabel,
}: FormListRowProps) {
  const row = (
    <Button onPress={onPress}>
      <HStack spacing={12}>
        {symbol ? (
          <Image
            systemName={symbol.sf}
            color={symbol.color}
            modifiers={[frame({ width: SYMBOL_WIDTH, height: SYMBOL_WIDTH })]}
          />
        ) : null}
        <Text modifiers={[PRIMARY]}>{title}</Text>
        <Spacer />
        {value ? <Text modifiers={[SECONDARY]}>{value}</Text> : null}
        <Image
          systemName="chevron.right"
          modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY]}
        />
      </HStack>
    </Button>
  );

  if (!onDelete) return row;

  return (
    <SwipeActions>
      {row}
      {/* Not `role="destructive"`: SwiftUI removes a destructive swipe row optimistically, before
          the confirmation, and Cancel can't bring it back. A red tint keeps the destructive look
          (the Host's accent tint would otherwise fill it orange). */}
      <SwipeActions.Actions edge="trailing">
        <Button
          label={deleteLabel}
          systemImage="trash"
          onPress={onDelete}
          modifiers={[tint(PlatformColor('systemRed'))]}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

/** A single-line text field row; the placeholder doubles as its label. */
export function FormTextFieldRow({
  placeholder,
  defaultValue = '',
  onChangeText,
  autoFocus,
  maxLength,
}: FormTextFieldRowProps) {
  const text = useNativeState(defaultValue);
  return (
    <TextField
      text={text}
      placeholder={placeholder}
      onTextChange={onChangeText}
      autoFocus={autoFocus}
      maxLength={maxLength}
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
