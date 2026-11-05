import { ActionSheetIOS, Platform } from 'react-native';

import { showAlertDialog } from '@/lib/alert-dialog';
import i18n from '@/lib/i18n';
import { dismissKeyboard } from '@/lib/keyboard';
import { k } from '@/locales/keys';

type ConfirmDestructiveOptions = {
  /** Optional heading. Leave it off when the confirm button already says what happens. */
  title?: string;
  /**
   * The Android dialog's headline when `title` is left off for the iOS sheet. M3 dialogs state
   * their purpose in the headline, as a question ("Delete transaction?").
   */
  dialogTitle?: string;
  /** Optional context, e.g. "This can't be undone." */
  message?: string;
  /** The red confirm button, named for the action ("Delete Transaction"). */
  confirmLabel: string;
  /** Defaults to Cancel. */
  cancelLabel?: string;
  onConfirm: () => void;
};

/**
 * Confirms a destructive action the person started (a Delete row, menu item or swipe, or leaving
 * with unsaved changes). iOS: an action sheet with the red confirm button and Cancel (HIG action
 * sheets, pull-down buttons). Android: an M3 dialog (`showAlertDialog`) headed by `title` or
 * `dialogTitle`, with Cancel and the confirm button in the error color.
 *
 * Errors and unexpected consequences (e.g. a delete that also removes other data) stay alerts
 * (`showAlertDialog`).
 */
export function confirmDestructive({
  title,
  dialogTitle,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: ConfirmDestructiveOptions) {
  const cancel: string = cancelLabel ?? i18n.t(k.common.cancel);
  if (Platform.OS === 'ios') {
    // The keyboard closes first: an action sheet presented while it's up sits under it.
    void dismissKeyboard().then(() =>
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          message,
          options: [confirmLabel, cancel],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          // No tintColor: the accent (#E24A00) sits next to system red, so a tinted Cancel read
          // as a second destructive button. The stock tint keeps the confirm the only red choice.
        },
        (index) => {
          if (index === 0) onConfirm();
        },
      ),
    );
    return;
  }
  showAlertDialog(title ?? dialogTitle ?? '', message, [
    { text: cancel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
