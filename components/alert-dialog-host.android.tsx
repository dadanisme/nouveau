import { AlertDialog, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { ComposeHost } from '@/components/compose-host';
import { ACCENT_COLOR } from '@/constants/accent';
import {
  closeAlertDialog,
  getAlertDialog,
  subscribeAlertDialog,
  type AlertDialogRequest,
} from '@/lib/alert-dialog-store';

// The accent as the `primary` role (the text buttons), like the forms.
const COLOR_OVERRIDES = { primary: ACCENT_COLOR as `#${string}` };

/**
 * Presents `showAlertDialog` requests as Material 3 dialogs. Mounted once at the root; the
 * Compose dialog opens in its own window, above every screen, sheet and modal.
 */
export function AlertDialogHost() {
  const request = useSyncExternalStore(subscribeAlertDialog, getAlertDialog);
  return (
    <View pointerEvents="none" style={styles.host}>
      <ComposeHost matchContents colorOverrides={COLOR_OVERRIDES}>
        {request ? <Dialog key={request.id} request={request} /> : null}
      </ComposeHost>
    </View>
  );
}

/** M3 basic dialog: `headlineSmall` headline, `bodyMedium` supporting text (expo-ui `Text`
 * doesn't take the slot's text style, so both are set). */
function Dialog({ request }: { request: AlertDialogRequest }) {
  const colors = useMaterialColors();
  const { title, message, confirm, dismiss } = request;
  // M3 error role: "attention-grabbing … indicating urgency", for the destructive action.
  const confirmColors =
    confirm.style === 'destructive' ? { contentColor: colors.error } : undefined;

  return (
    <AlertDialog onDismissRequest={() => closeAlertDialog(dismiss)}>
      {title ? (
        <AlertDialog.Title>
          <Text style={{ typography: 'headlineSmall' }}>{title}</Text>
        </AlertDialog.Title>
      ) : null}
      {message ? (
        <AlertDialog.Text>
          <Text style={{ typography: 'bodyMedium' }}>{message}</Text>
        </AlertDialog.Text>
      ) : null}
      <AlertDialog.ConfirmButton>
        <TextButton colors={confirmColors} onClick={() => closeAlertDialog(confirm)}>
          <Text>{confirm.text ?? ''}</Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
      {dismiss ? (
        <AlertDialog.DismissButton>
          <TextButton onClick={() => closeAlertDialog(dismiss)}>
            <Text>{dismiss.text ?? ''}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      ) : null}
    </AlertDialog>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0 },
});
