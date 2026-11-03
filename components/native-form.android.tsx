import {
  Badge,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  Text,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import { background, clickable, fillMaxSize, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import type {
  FormButtonRowProps,
  FormNavRowProps,
  FormNoticeRowProps,
  FormPickerRowProps,
  FormSectionProps,
  NativeFormProps,
} from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 list metrics: 16dp side padding, section headers spaced from the previous group.
const SIDE = 16;

// The system (dynamic) palette, so surfaces match the native tab bar; the accent only tints, as
// the `primary` role (section headers).
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

/**
 * A full-screen Compose `LazyColumn` of Material 3 list items on the `surface` role. Render it as
 * the screen's root, under the native Stack header.
 */
export function NativeForm({ children }: NativeFormProps) {
  return (
    <Host style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <FormSurface>{children}</FormSurface>
    </Host>
  );
}

function FormSurface({ children }: NativeFormProps) {
  const colors = useMaterialColors();
  return (
    <LazyColumn
      contentPadding={{ bottom: 24 }}
      modifiers={[fillMaxSize(), background(colors.surface)]}
    >
      {children}
    </LazyColumn>
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
