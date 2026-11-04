import { Alert, type AlertButton } from 'react-native';

/**
 * Shows an alert. iOS: `Alert.alert` (a native alert). Android: a Material 3 dialog
 * (`lib/alert-dialog.android.ts`). Same arguments as `Alert.alert`.
 */
export function showAlertDialog(title: string, message?: string, buttons?: AlertButton[]) {
  Alert.alert(title, message, buttons);
}
