import { useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';

import { confirmDestructive } from '@/lib/confirm-destructive';
import i18n from '@/lib/i18n';
import { dismissKeyboard } from '@/lib/keyboard';
import { k } from '@/locales/keys';

/**
 * Asks whether to drop unsaved changes: an action sheet on iOS (Discard Changes / Keep Editing,
 * HIG sheets), an M3 dialog on Android. `onDiscard` runs only if the person discards.
 */
function confirmDiscard(onDiscard: () => void) {
  confirmDestructive({
    // The iOS sheet's buttons say it all; the Android dialog keeps its question.
    dialogTitle: i18n.t(k.common.discardChangesPrompt),
    confirmLabel: i18n.t(k.common.discardChanges),
    cancelLabel: i18n.t(k.common.keepEditing),
    onConfirm: onDiscard,
  });
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
 * Cancel and Close pass `{ confirm: true }`: while dirty it asks first, then navigates itself. The
 * guard's replay can't stand in for that: a held `router.replace('/')` (Cancel with nothing behind
 * it, from a cold deep link) isn't handled when replayed from the screen.
 */
export function useDiscardGuard(
  isDirty: boolean,
  { pushed = false }: { pushed?: boolean } = {},
): (navigate: () => void, options?: { confirm?: boolean }) => void {
  const navigation = useNavigation();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (pushed) navigation.setOptions({ gestureEnabled: !isDirty || isLeaving });
  }, [navigation, pushed, isDirty, isLeaving]);

  const disablePrevention = usePreventRemove(isDirty && !isLeaving, ({ repeat }) => {
    // Close the keyboard first: it commits a pending autocorrection on blur, and that edit must
    // land before the prompt, not while leaving. A sheet shown while it's up sits under it.
    void dismissKeyboard().then(() =>
      confirmDiscard(() => {
        setIsLeaving(true);
        // Repeat once the lifted guard has rendered, so the repeated action isn't held again.
        requestAnimationFrame(repeat);
      }),
    );
  });

  return (navigate, { confirm = false } = {}) => {
    const go = () => {
      setIsLeaving(true);
      disablePrevention();
      navigate();
    };
    if (!confirm || !isDirty || isLeaving) return go();
    void dismissKeyboard().then(() => confirmDiscard(go));
  };
}
