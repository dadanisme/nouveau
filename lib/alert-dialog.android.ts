import { Alert, type AlertButton } from 'react-native';

import { hasAlertDialogHost, presentAlertDialog } from '@/lib/alert-dialog-store';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/**
 * Shows an alert as a Material 3 dialog (Compose `AlertDialog`, presented by `AlertDialogHost`):
 * headline, optional supporting text, the dismissive action left of the confirming one.
 * `Alert.alert` on Android is the legacy AppCompat dialog (all-caps buttons, no error color).
 * Same arguments as `Alert.alert`. Falls back to it with no host mounted, or with more than
 * one non-cancel button.
 */
export function showAlertDialog(title: string, message?: string, buttons?: AlertButton[]) {
  const dismiss = buttons?.find((button) => button.style === 'cancel');
  const actions = buttons?.filter((button) => button.style !== 'cancel') ?? [];
  if (!hasAlertDialogHost() || actions.length > 1) {
    Alert.alert(title, message, buttons);
    return;
  }
  presentAlertDialog({
    title,
    message: message || undefined,
    confirm: actions[0] ?? dismiss ?? { text: i18n.t(k.common.ok) },
    dismiss: actions[0] ? dismiss : undefined,
  });
}
