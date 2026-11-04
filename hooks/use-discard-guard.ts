import { useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Keyboard, Platform } from 'react-native';

import { ACCENT_HEX } from '@/constants/accent';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/**
 * Asks whether to drop unsaved changes: an action sheet on iOS (Discard Changes / Keep Editing,
 * HIG sheets), an M3 dialog on Android. `onDiscard` runs only if the person discards.
 */
function confirmDiscard(onDiscard: () => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [i18n.t(k.common.discardChanges), i18n.t(k.common.keepEditing)],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        // ActionSheetIOS only takes a plain color: a DynamicColorIOS is rejected and the sheet
        // never shows.
        tintColor: ACCENT_HEX,
      },
      (index) => {
        if (index === 0) onDiscard();
      },
    );
    return;
  }
  Alert.alert(i18n.t(k.common.discardChangesPrompt), undefined, [
    { text: i18n.t(k.common.keepEditing), style: 'cancel' },
    { text: i18n.t(k.common.discardChanges), style: 'destructive', onPress: onDiscard },
  ]);
}

/**
 * Guards a form screen with unsaved changes: while `isDirty`, leaving it by any route (a sheet's
 * swipe-down, Cancel, the back button or swipe-back) is held and the person confirms first. On
 * iOS the blocked sheet swipe springs back (react-native-screens `preventNativeDismiss`).
 *
 * The iOS swipe-back of a pushed screen isn't held reliably (it can pop natively past the guard),
 * so a pushed screen passes `pushed`: swipe-back is off while dirty and the Back button prompts.
 * Sheets leave it off, so swiping one down still asks first.
 *
 * Returns `leave(navigate)`: lifts the guard and navigates, for leaving after a save or delete.
 */
export function useDiscardGuard(
  isDirty: boolean,
  { pushed = false }: { pushed?: boolean } = {},
): (navigate: () => void) => void {
  const navigation = useNavigation();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (pushed) navigation.setOptions({ gestureEnabled: !isDirty || isLeaving });
  }, [navigation, pushed, isDirty, isLeaving]);

  const disablePrevention = usePreventRemove(isDirty && !isLeaving, ({ repeat }) => {
    // Close the keyboard first: it commits a pending autocorrection on blur, and that edit must
    // land before the prompt, not while leaving.
    Keyboard.dismiss();
    confirmDiscard(() => {
      setIsLeaving(true);
      // Repeat once the lifted guard has rendered, so the repeated action isn't held again.
      requestAnimationFrame(repeat);
    });
  });

  return (navigate) => {
    setIsLeaving(true);
    disablePrevention();
    navigate();
  };
}
