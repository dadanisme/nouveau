import {
  Badge,
  Box,
  CircularProgressIndicator,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  ListItem,
  PullToRefreshBox,
  Row,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Text,
  TextField,
  useMaterialColors,
  useNativeState,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  combinedClickable,
  fillMaxSize,
  fillMaxWidth,
  padding,
  selectable,
  semantics,
  size,
  type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

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
  FormSymbol,
  FormTextFieldRowProps,
  NativeFormProps,
} from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { useMaterialSymbolSources } from '@/hooks/use-material-symbol-sources';
import { k } from '@/locales/keys';

// Material 3 list metrics: 16dp side padding, section headers spaced from the previous group.
const SIDE = 16;

// The system (dynamic) palette, so surfaces match the native tab bar; the accent only tints, as
// the `primary` role (section headers).
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

// Material 3 metrics: 24dp sheet top padding and leading icons.
const SHEET_TOP = 24;
const ICON_SIZE = 24;
// Sheets don't inset for the gesture bar, so the last row clears it.
const SHEET_BOTTOM = 72;

/**
 * A full-screen Compose `LazyColumn` of Material 3 list items on the `surface` role. Render it as
 * the screen's root, under the native Stack header. `title` adds a sheet heading; `onRefresh`
 * wraps the list in a `PullToRefreshBox`.
 */
export function NativeForm(props: NativeFormProps) {
  return (
    <Host style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <FormSurface {...props} />
    </Host>
  );
}

function FormSurface({ title, onRefresh, children }: NativeFormProps) {
  const colors = useMaterialColors();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const list = (
    <LazyColumn
      contentPadding={{ top: title ? SHEET_TOP : 0, bottom: title ? SHEET_BOTTOM : 24 }}
      modifiers={[fillMaxSize(), background(colors.surface)]}
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

/** A Material Symbol from the font, tinted; a same-size blank until its image is ready. */
function SymbolIcon({ symbol, iconSize = ICON_SIZE }: { symbol: FormSymbol; iconSize?: number }) {
  const sources = useMaterialSymbolSources([symbol.material], iconSize);
  const source = sources.get(symbol.material);
  if (!source) return <Box modifiers={[size(iconSize, iconSize)]} />;
  return <Icon source={source} size={iconSize} tint={symbol.color} />;
}

export function FormSection({ title, footer, children }: FormSectionProps) {
  const colors = useMaterialColors();
  return (
    <>
      {title ? (
        <Text
          color={colors.primary}
          style={{ typography: 'titleSmall' }}
          modifiers={[padding(SIDE, 24, SIDE, 8)]}
        >
          {title}
        </Text>
      ) : null}
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

export function FormNavRow({ title, icon, value, badge, onPress }: FormNavRowProps) {
  return (
    <ListItem modifiers={[clickable(onPress)]}>
      <RowIcon icon={icon} />
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

export function FormButtonRow({ title, role, icon, disabled, onPress }: FormButtonRowProps) {
  const colors = useMaterialColors();
  const color = role === 'destructive' ? colors.error : undefined;
  return (
    <ListItem
      modifiers={disabled ? [] : [clickable(onPress)]}
      colors={color ? { contentColor: color, leadingContentColor: color } : undefined}
    >
      <RowIcon icon={icon} tint={color} />
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
    </ListItem>
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
}: Pick<FormListRowProps, 'actions' | 'onDelete' | 'deleteLabel'>): FormRowAction[] {
  const all = [...(actions ?? [])];
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
  value,
  selected,
  onPress,
  actions,
  onDelete,
  deleteLabel,
}: FormListRowProps) {
  const { t } = useLanguage();
  const colors = useMaterialColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const all = rowActions({ actions, onDelete, deleteLabel });
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
          <SymbolIcon symbol={symbol} />
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

/**
 * A single-line filled Material text field (see `FormTextFieldRowProps`); the floating label is
 * `label`, or the placeholder.
 */
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
  submitLabel = 'done',
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
  const submit = onSubmit ? () => onSubmit() : undefined;

  return (
    <TextField
      value={text}
      onValueChange={(next) => {
        lastText.current = next;
        onChangeText(next);
      }}
      autoFocus={autoFocus}
      maxLength={maxLength}
      singleLine
      keyboardOptions={{
        capitalization: autoCapitalize ?? (isEmail ? 'none' : 'sentences'),
        autoCorrectEnabled: !isEmail,
        keyboardType: isEmail ? 'email' : 'text',
        imeAction: submitLabel,
      }}
      keyboardActions={{ onDone: submit, onSend: submit, onNext: submit }}
      modifiers={[
        fillMaxWidth(),
        padding(SIDE, 8, SIDE, 8),
        ...(isEmail ? [semantics({ contentType: 'emailAddress' })] : []),
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

/** A centered empty state: large symbol, title and description. */
export function FormEmptyRow({ title, description, symbol }: FormEmptyRowProps) {
  const colors = useMaterialColors();
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={[fillMaxWidth(), padding(SIDE, 48, SIDE, 24)]}
    >
      <SymbolIcon symbol={{ ...symbol, color: colors.onSurfaceVariant }} iconSize={48} />
      <Text color={colors.onSurface} style={{ typography: 'titleMedium' }}>
        {title}
      </Text>
      {description ? (
        <Text color={colors.onSurfaceVariant} style={{ typography: 'bodyMedium' }}>
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
