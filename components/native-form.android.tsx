import {
  Badge,
  Box,
  Button,
  CircularProgressIndicator,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  FilledTonalButton,
  Icon,
  IconButton,
  LazyColumn,
  LinearProgressIndicator,
  ListItem,
  PullToRefreshBox,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Surface,
  Text,
  TextField,
  useMaterialColors,
  useNativeState,
  type MaterialColors,
  type TextFieldImeAction,
  type TextFieldRef,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  combinedClickable,
  fillMaxSize,
  fillMaxWidth,
  height,
  imePadding,
  padding,
  selectable,
  semantics,
  Shapes,
  size,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ComposeHost } from '@/components/compose-host';
import { ComposeSymbolIcon } from '@/components/compose-symbol-icon';
import type {
  FormButtonRowProps,
  FormEmptyRowProps,
  FormListRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
  FormRowAction,
  FormSectionProps,
  FormProgressRowProps,
  FormSegmentedRowProps,
  FormTextFieldContentType,
  FormTextFieldRowProps,
  FormValueRowProps,
  NativeFormProps,
} from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

// Material 3 list metrics: 16dp side padding, section headers spaced from the previous group.
const SIDE = 16;
// The space above a section, titled or not, so an untitled one still reads as its own group.
const SECTION_GAP = 24;
// M3 disabled content: `onSurface` at 38% opacity (`#RRGGBBAA`, 0x61 ≈ 0.38).
const DISABLED_ALPHA = '61';

// The system (dynamic) palette, so surfaces match the native tab bar; the accent only tints, as
// the `primary` role (section headers).
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

// A full-width M3 button at the 48dp touch-target height (the default is 40dp).
const BUTTON_HEIGHT = 48;
const PROGRESS_SIZE = 18;
// A leading color swatch at the M3 24dp leading-icon size, as in the color picker rows.
const SWATCH_SIZE = 24;

// Material 3 metrics: 24dp sheet top padding.
const SHEET_TOP = 24;
// Sheets don't inset for the gesture bar, so the last row clears it.
const SHEET_BOTTOM = 72;

/**
 * A full-screen Compose `LazyColumn` of Material 3 list items on the `surface` role. Render it as
 * the screen's root, under the native Stack header. `title` adds a sheet heading; `onRefresh`
 * wraps the list in a `PullToRefreshBox`.
 */
export function NativeForm(props: NativeFormProps) {
  return (
    <ComposeHost style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <FormSurface {...props} />
    </ComposeHost>
  );
}

function FormSurface({ title, onRefresh, bottomInset = 0, children }: NativeFormProps) {
  const colors = useMaterialColors();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const list = (
    <LazyColumn
      contentPadding={{
        top: title ? SHEET_TOP : 0,
        bottom: (title ? SHEET_BOTTOM : 24) + bottomInset,
      }}
      // Insets the list above the keyboard, so a focused text field can scroll clear of it.
      modifiers={[fillMaxSize(), background(colors.surface), imePadding()]}
    >
      {title ? (
        <Text
          color={colors.onSurface}
          style={{ typography: 'titleLarge' }}
          modifiers={[padding(SIDE, 0, SIDE, 8)]}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </LazyColumn>
  );

  if (!onRefresh) return list;

  return (
    <PullToRefreshBox
      isRefreshing={isRefreshing}
      onRefresh={() => {
        setIsRefreshing(true);
        onRefresh().finally(() => setIsRefreshing(false));
      }}
      contentAlignment="topCenter"
      modifiers={[fillMaxSize()]}
    >
      {list}
    </PullToRefreshBox>
  );
}

export function FormSection({ title, footer, children }: FormSectionProps) {
  const colors = useMaterialColors();
  return (
    <>
      {title ? (
        <Text
          color={colors.primary}
          style={{ typography: 'titleSmall' }}
          modifiers={[padding(SIDE, SECTION_GAP, SIDE, 8)]}
        >
          {title}
        </Text>
      ) : (
        <Box modifiers={[fillMaxWidth(), height(SECTION_GAP)]} />
      )}
      {children}
      {footer ? (
        <Text
          color={colors.onSurfaceVariant}
          style={{ typography: 'bodySmall' }}
          modifiers={[padding(SIDE, 4, SIDE, 8)]}
        >
          {footer}
        </Text>
      ) : null}
    </>
  );
}

function RowIcon({ icon, tint }: { icon?: FormNavRowProps['icon']; tint?: string }) {
  if (!icon) return null;
  return (
    <ListItem.LeadingContent>
      <Icon source={icon.md} tint={tint} />
    </ListItem.LeadingContent>
  );
}

/** A row that opens a screen or sheet; `destructive` paints the title and icon in the error role. */
export function FormNavRow({ title, role, icon, value, badge, onPress }: FormNavRowProps) {
  const colors = useMaterialColors();
  const color = role === 'destructive' ? colors.error : undefined;
  return (
    // Keyed on whether a value shows: a supporting slot added after the first render (e.g. the
    // workspace name once it loads) sometimes never appeared.
    <ListItem
      key={value ? 'value' : 'plain'}
      modifiers={[clickable(onPress)]}
      colors={color ? { contentColor: color, leadingContentColor: color } : undefined}
    >
      <RowIcon icon={icon} tint={color} />
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      {value ? (
        <ListItem.SupportingContent>
          <Text>{value}</Text>
        </ListItem.SupportingContent>
      ) : null}
      {badge ? (
        <ListItem.TrailingContent>
          <Badge>
            <Text>{String(badge)}</Text>
          </Badge>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}

/** A row showing the current option; tapping it opens a Material dropdown menu of the options. */
export function FormPickerRow<T extends string>({
  title,
  icon,
  options,
  selection,
  onSelectionChange,
}: FormPickerRowProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const current = options.find((option) => option.value === selection);

  return (
    <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
      <DropdownMenu.Trigger>
        <ListItem modifiers={[clickable(() => setExpanded(true))]}>
          <RowIcon icon={icon} />
          <ListItem.HeadlineContent>
            <Text>{title}</Text>
          </ListItem.HeadlineContent>
          {current ? (
            <ListItem.SupportingContent>
              <Text>{current.label}</Text>
            </ListItem.SupportingContent>
          ) : null}
        </ListItem>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              setExpanded(false);
              if (option.value !== selection) onSelectionChange(option.value);
            }}
          >
            <DropdownMenuItem.Text>
              <Text>{option.label}</Text>
            </DropdownMenuItem.Text>
            {option.value === selection ? (
              <DropdownMenuItem.TrailingIcon>
                <Icon source={require('@/assets/icons/check.xml')} />
              </DropdownMenuItem.TrailingIcon>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}

export function FormButtonRow({
  title,
  role,
  icon,
  emphasis,
  disabled,
  pending,
  onPress,
}: FormButtonRowProps) {
  const colors = useMaterialColors();
  const color = role === 'destructive' ? colors.error : undefined;
  if (emphasis) {
    // M3 buttons: filled "for important, final actions that complete a flow, like Save"; tonal
    // for "a lower-priority button [that] requires slightly more emphasis than an outline".
    const ActionButton = emphasis === 'filled' ? Button : FilledTonalButton;
    return (
      <ActionButton
        onClick={onPress}
        enabled={!disabled && !pending}
        modifiers={[fillMaxWidth(), padding(SIDE, 8, SIDE, 8), height(BUTTON_HEIGHT)]}
      >
        <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
          {pending ? (
            <CircularProgressIndicator
              strokeWidth={2}
              modifiers={[size(PROGRESS_SIZE, PROGRESS_SIZE)]}
            />
          ) : null}
          <Text>{title}</Text>
        </Row>
      </ActionButton>
    );
  }
  const isEnabled = !disabled && !pending;
  // Disabled, the row takes M3's disabled content color whatever its role.
  const contentColor = isEnabled ? color : `${colors.onSurface.slice(0, 7)}${DISABLED_ALPHA}`;
  return (
    // The clickable Surface, rather than a `clickable` modifier, reports the disabled state to
    // TalkBack ("Delete account, disabled") and drops the ripple.
    <Surface onClick={onPress} enabled={isEnabled} modifiers={[fillMaxWidth()]}>
      <ListItem
        colors={contentColor ? { contentColor, leadingContentColor: contentColor } : undefined}
      >
        {pending ? (
          // The running action: M3's circular indicator in place of the icon.
          <ListItem.LeadingContent>
            <CircularProgressIndicator
              strokeWidth={2}
              modifiers={[size(PROGRESS_SIZE, PROGRESS_SIZE)]}
            />
          </ListItem.LeadingContent>
        ) : (
          <RowIcon icon={icon} tint={contentColor} />
        )}
        <ListItem.HeadlineContent>
          <Text>{title}</Text>
        </ListItem.HeadlineContent>
      </ListItem>
    </Surface>
  );
}

export function FormNoticeRow({ text, icon }: FormNoticeRowProps) {
  const colors = useMaterialColors();
  return (
    <ListItem colors={{ leadingContentColor: colors.error }}>
      <RowIcon icon={icon} tint={colors.error} />
      <ListItem.HeadlineContent>
        <Text style={{ typography: 'bodyMedium' }}>{text}</Text>
      </ListItem.HeadlineContent>
    </ListItem>
  );
}

/** An action list for a row: `actions`, then the `onDelete` shorthand (no icon, as before). */
function rowActions({
  actions,
  onDelete,
  deleteLabel,
  onEdit,
  editLabel,
}: Pick<
  FormListRowProps,
  'actions' | 'onDelete' | 'deleteLabel' | 'onEdit' | 'editLabel'
>): FormRowAction[] {
  const all = [
    ...(onEdit ? [{ title: editLabel ?? '', onPress: onEdit }] : []),
    ...(actions ?? []),
  ];
  if (onDelete) all.push({ title: deleteLabel ?? '', role: 'destructive', onPress: onDelete });
  return all;
}

/** Dropdown items for row actions; destructive ones in the error color. */
function RowActionItems({
  actions,
  onClose,
}: {
  actions: readonly FormRowAction[];
  onClose: () => void;
}) {
  const colors = useMaterialColors();
  return (
    <DropdownMenu.Items>
      {actions.map((action) => {
        const color = action.role === 'destructive' ? colors.error : undefined;
        return (
          <DropdownMenuItem
            key={action.title}
            onClick={() => {
              onClose();
              action.onPress();
            }}
          >
            {action.icon ? (
              <DropdownMenuItem.LeadingIcon>
                <Icon source={action.icon.md} tint={color} />
              </DropdownMenuItem.LeadingIcon>
            ) : null}
            <DropdownMenuItem.Text>
              <Text color={color}>{action.title}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        );
      })}
    </DropdownMenu.Items>
  );
}

/**
 * The generic list item (see `FormListRowProps`): leading symbol/icon, headline, supporting text,
 * a trailing value or checkmark. Actions open from a long press on clickable rows (Compose has no
 * stock swipe-to-dismiss in `@expo/ui`) and from a visible ⋮ button on static rows.
 */
export function FormListRow({
  title,
  subtitle,
  icon,
  symbol,
  swatch,
  value,
  selected,
  onPress,
  actions,
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
}: FormListRowProps) {
  const { t } = useLanguage();
  const colors = useMaterialColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const all = rowActions({ actions, onDelete, deleteLabel, onEdit, editLabel });
  const hasActions = all.length > 0;
  const longPressMenu = hasActions && !!onPress;
  const overflowMenu = hasActions && !onPress;
  const supporting = subtitle ?? value;
  const trailingValue = subtitle ? value : undefined;

  let modifiers: ModifierConfig[] = [];
  if (onPress) {
    if (longPressMenu) {
      modifiers = [combinedClickable({ onClick: onPress, onLongClick: () => setMenuOpen(true) })];
    } else if (selected !== undefined) {
      modifiers = [selectable(selected, onPress)];
    } else {
      modifiers = [clickable(onPress)];
    }
  }

  const item = (
    <ListItem modifiers={modifiers}>
      {symbol ? (
        <ListItem.LeadingContent>
          <ComposeSymbolIcon symbol={symbol} />
        </ListItem.LeadingContent>
      ) : swatch ? (
        <ListItem.LeadingContent>
          <Box
            modifiers={[size(SWATCH_SIZE, SWATCH_SIZE), clip(Shapes.Circle), background(swatch)]}
          />
        </ListItem.LeadingContent>
      ) : (
        <RowIcon icon={icon} />
      )}
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      {supporting ? (
        <ListItem.SupportingContent>
          <Text>{supporting}</Text>
        </ListItem.SupportingContent>
      ) : null}
      {trailingValue || selected || overflowMenu ? (
        <ListItem.TrailingContent>
          <Row verticalAlignment="center">
            {trailingValue ? (
              <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
                {trailingValue}
              </Text>
            ) : null}
            {selected ? (
              <Icon source={require('@/assets/icons/check.xml')} tint={colors.primary} />
            ) : null}
            {overflowMenu ? (
              <DropdownMenu expanded={menuOpen} onDismissRequest={() => setMenuOpen(false)}>
                <DropdownMenu.Trigger>
                  <IconButton onClick={() => setMenuOpen(true)}>
                    <Icon
                      source={require('@/assets/icons/more_vert.xml')}
                      contentDescription={t(k.common.moreActions)}
                    />
                  </IconButton>
                </DropdownMenu.Trigger>
                <RowActionItems actions={all} onClose={() => setMenuOpen(false)} />
              </DropdownMenu>
            ) : null}
          </Row>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );

  if (!longPressMenu) return item;

  return (
    <DropdownMenu expanded={menuOpen} onDismissRequest={() => setMenuOpen(false)}>
      <DropdownMenu.Trigger>{item}</DropdownMenu.Trigger>
      <RowActionItems actions={all} onClose={() => setMenuOpen(false)} />
    </DropdownMenu>
  );
}

// Compose autofill hints (`ContentType`), as named by the expo-ui `semantics` modifier.
const AUTOFILL_HINT: Record<FormTextFieldContentType, string> = {
  emailAddress: 'email',
  username: 'username',
  newUsername: 'username-new',
  password: 'current-password',
  newPassword: 'new-password',
};

// Android IME actions have no "join"; Done submits instead.
const IME_ACTION: Record<NonNullable<FormTextFieldRowProps['submitLabel']>, TextFieldImeAction> = {
  done: 'done',
  send: 'send',
  next: 'next',
  go: 'go',
  join: 'done',
};

/**
 * A single-line filled Material text field (see `FormTextFieldRowProps`); the floating label is
 * `label`, or the placeholder. Secure fields are masked, with the M3 trailing show/hide toggle.
 */
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
  submitLabel = 'done',
  onSubmit,
  disabled,
}: FormTextFieldRowProps) {
  const { t } = useLanguage();
  const initial = value ?? defaultValue;
  const text = useNativeState(initial);
  // The last text the field reported, so only outside `value` changes are written back to it.
  const lastText = useRef(initial);
  const field = useRef<TextFieldRef>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => void field.current?.focus() }), []);

  useEffect(() => {
    if (value === undefined || value === lastText.current) return;
    lastText.current = value;
    text.set(value);
  }, [value, text]);

  const isEmail = keyboard === 'email';
  const isPlain = isEmail || secure;
  const autofill = contentType ?? (isEmail ? 'emailAddress' : undefined);
  const submit = onSubmit ? () => onSubmit() : undefined;

  return (
    <TextField
      ref={field}
      value={text}
      onValueChange={(next) => {
        lastText.current = next;
        onChangeText(next);
      }}
      autoFocus={autoFocus}
      maxLength={maxLength}
      enabled={!disabled}
      singleLine
      visualTransformation={secure && !isRevealed ? 'password' : 'none'}
      keyboardOptions={{
        capitalization: autoCapitalize ?? (isPlain ? 'none' : 'sentences'),
        autoCorrectEnabled: !isPlain,
        keyboardType: secure ? 'password' : isEmail ? 'email' : 'text',
        imeAction: IME_ACTION[submitLabel],
      }}
      keyboardActions={{ onDone: submit, onSend: submit, onNext: submit, onGo: submit }}
      modifiers={[
        fillMaxWidth(),
        padding(SIDE, 8, SIDE, 8),
        ...(autofill ? [semantics({ contentType: AUTOFILL_HINT[autofill] })] : []),
      ]}
    >
      <TextField.Label>
        <Text>{label ?? placeholder}</Text>
      </TextField.Label>
      {label ? (
        <TextField.Placeholder>
          <Text>{placeholder}</Text>
        </TextField.Placeholder>
      ) : null}
      {secure ? (
        <TextField.TrailingIcon>
          <IconButton onClick={() => setIsRevealed((revealed) => !revealed)}>
            <Icon
              source={
                isRevealed
                  ? require('@/assets/icons/visibility_off.xml')
                  : require('@/assets/icons/visibility.xml')
              }
              contentDescription={t(isRevealed ? k.login.hidePassword : k.login.showPassword)}
            />
          </IconButton>
        </TextField.TrailingIcon>
      ) : null}
    </TextField>
  );
}

/** A full-width single-choice segmented button row. */
export function FormSegmentedRow<T extends string>({
  label,
  options,
  selection,
  onSelectionChange,
}: FormSegmentedRowProps<T>) {
  return (
    <SingleChoiceSegmentedButtonRow
      modifiers={[
        fillMaxWidth(),
        padding(SIDE, 8, SIDE, 8),
        semantics({ contentDescription: label }),
      ]}
    >
      {options.map((option) => (
        <SegmentedButton
          key={option.value}
          selected={option.value === selection}
          onClick={() => {
            if (option.value !== selection) onSelectionChange(option.value);
          }}
        >
          <SegmentedButton.Label>
            <Text>{option.label}</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}

/** A read-only label/value list item (e.g. a total); the value trails in the on-surface color. */
export function FormValueRow({ title, value, emphasized }: FormValueRowProps) {
  const colors = useMaterialColors();
  const style = { typography: 'bodyLarge', fontWeight: emphasized ? '600' : undefined } as const;
  return (
    <ListItem>
      <ListItem.HeadlineContent>
        <Text style={style}>{title}</Text>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <Text color={colors.onSurface} style={style}>
          {value}
        </Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/** A list item with a symbol, title, trailing value and a linear progress bar in its color. */
export function FormProgressRow({ title, symbol, value, progress, onPress }: FormProgressRowProps) {
  const colors = useMaterialColors();
  return (
    <ListItem modifiers={onPress ? [clickable(onPress)] : []}>
      {symbol ? (
        <ListItem.LeadingContent>
          <ComposeSymbolIcon symbol={symbol} />
        </ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        <Text maxLines={1} overflow="ellipsis">
          {title}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <LinearProgressIndicator
          progress={Math.min(Math.max(progress, 0), 1)}
          color={symbol?.color}
          trackColor={colors.surfaceContainerHighest}
          modifiers={[fillMaxWidth(), padding(0, 8, 0, 4)]}
        />
      </ListItem.SupportingContent>
      <ListItem.TrailingContent>
        <Text color={colors.onSurface} style={{ typography: 'bodyMedium' }}>
          {value}
        </Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

/** A centered empty state: large symbol, title and description. */
export function FormEmptyRow({ title, description, symbol }: FormEmptyRowProps) {
  const colors = useMaterialColors();
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxWidth(), padding(SIDE, 48, SIDE, 24)]}
    >
      <ComposeSymbolIcon symbol={{ ...symbol, color: colors.onSurfaceVariant }} iconSize={48} />
      <Text color={colors.onSurface} style={{ typography: 'titleMedium', textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          color={colors.onSurfaceVariant}
          style={{ typography: 'bodyMedium', textAlign: 'center' }}
        >
          {description}
        </Text>
      ) : null}
    </Column>
  );
}

/** A centered circular progress indicator. */
export function FormLoadingRow() {
  return (
    <Box contentAlignment="center" modifiers={[fillMaxWidth(), padding(SIDE, 48, SIDE, 24)]}>
      <CircularProgressIndicator />
    </Box>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
