import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';
import { isIOSVersionAtLeast } from '@/utils/platform';

/**
 * iOS 26+ editors show their header actions as symbols, as Apple's own sheets do (Calendar's New
 * Event): `xmark` to cancel, `checkmark` (or `arrow.up` to send) to confirm, each with its word
 * as the VoiceOver label. iOS 17–18 keep the words.
 */
export const HEADER_ACTIONS_AS_SYMBOLS = isIOSVersionAtLeast(26);

type SheetToolbarProps = {
  onPress: () => void;
};

/**
 * The leading Close of a sheet or modal with nothing to save (a picker, a viewer): the system
 * `xmark` button, labelled "Close" for VoiceOver (HIG toolbars: the standard symbol, no text).
 * Android header buttons are icon images, so the item waits for the icon.
 */
export function SheetCloseToolbar({ onPress }: SheetToolbarProps) {
  const { t } = useLanguage();
  const closeIcon = useSymbolIcon({ sf: 'xmark', md: 'close' });
  const icon = Platform.OS === 'ios' ? 'xmark' : closeIcon;

  if (!icon) return null;

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button icon={icon} accessibilityLabel={t(k.common.close)} onPress={onPress} />
    </Stack.Toolbar>
  );
}

/**
 * The leading Cancel of an editor (it leaves without saving; the screen's discard guard confirms
 * unsaved changes). iOS 26+ shows `xmark` (labelled "Cancel"), iOS 17–18 the word; Android
 * shows the M3 full-screen dialog's close icon.
 */
export function SheetCancelToolbar({ onPress }: SheetToolbarProps) {
  const { t } = useLanguage();
  const closeIcon = useSymbolIcon({ sf: 'xmark', md: 'close' });

  if (HEADER_ACTIONS_AS_SYMBOLS) {
    return (
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel={t(k.common.cancel)}
          onPress={onPress}
        />
      </Stack.Toolbar>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={onPress}>{t(k.common.cancel)}</Stack.Toolbar.Button>
      </Stack.Toolbar>
    );
  }

  if (!closeIcon) return null;

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon={closeIcon}
        accessibilityLabel={t(k.common.cancel)}
        onPress={onPress}
      />
    </Stack.Toolbar>
  );
}
