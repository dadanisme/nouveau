import { Stack } from 'expo-router';
import { ActivityIndicator, Platform } from 'react-native';

import { HEADER_ACTIONS_AS_SYMBOLS } from '@/components/sheet-toolbar';
import { useLanguage } from '@/contexts/language';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

export type FormSaveToolbarProps = {
  /**
   * The action's name, e.g. Save or Create. iOS 17–18 show it; iOS 26+ and Android speak it on
   * the symbol.
   */
  title: string;
  /** The iOS 26+ symbol: `checkmark` to save or create (default), `arrow.up` to send. */
  symbol?: 'checkmark' | 'arrow.up';
  disabled?: boolean;
  /** The action is running: on iOS an activity indicator takes the button's place. */
  pending?: boolean;
  onPress: () => void;
};

/**
 * The confirming action of a form screen, in the header's trailing toolbar: on iOS 26+ a prominent
 * symbol button (`checkmark`, or `arrow.up` to send, labelled with `title`), on iOS 17–18 a text
 * `done` button (dimmed while disabled; an activity indicator while pending on both), a ✓ icon
 * button on Android (toolbar buttons there are icon-only), hidden while disabled.
 */
export function FormSaveToolbar({
  title,
  symbol = 'checkmark',
  disabled,
  pending,
  onPress,
}: FormSaveToolbarProps) {
  const { t } = useLanguage();
  const checkIcon = useSymbolIcon({ sf: 'checkmark', md: 'check' });

  if (Platform.OS === 'ios') {
    return (
      <Stack.Toolbar placement="right">
        {pending ? (
          <Stack.Toolbar.View>
            <ActivityIndicator accessibilityLabel={t(k.common.pleaseWait)} />
          </Stack.Toolbar.View>
        ) : HEADER_ACTIONS_AS_SYMBOLS ? (
          <Stack.Toolbar.Button
            icon={symbol}
            variant="prominent"
            accessibilityLabel={title}
            disabled={disabled}
            onPress={onPress}
          />
        ) : (
          <Stack.Toolbar.Button variant="done" disabled={disabled} onPress={onPress}>
            {title}
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    );
  }

  // Android needs the icon as an image, so wait for it rather than show an empty slot.
  if (!checkIcon) return null;

  // expo-router tints Android toolbar icons explicitly, so a disabled ✓ looks enabled: show it
  // only while the action is available.
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={checkIcon}
        accessibilityLabel={title}
        disabled={disabled}
        hidden={disabled}
        onPress={onPress}
      />
    </Stack.Toolbar>
  );
}
