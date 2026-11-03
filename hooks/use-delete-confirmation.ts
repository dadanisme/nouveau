import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/**
 * Delete a transaction behind a native confirmation alert (Cancel + destructive Delete).
 * Returns `requestDelete(id)`; a failed delete shows a native error alert.
 */
export function useDeleteConfirmation() {
  const deleteMutation = useDeleteTransaction();

  function deleteTransaction(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (error) => {
        Alert.alert(
          i18n.t(k.addTransaction.failedToDelete),
          error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
        );
      },
    });
  }

  function requestDelete(id: string) {
    Alert.alert(
      i18n.t(k.addTransaction.deleteTransaction),
      i18n.t(k.addTransaction.deleteTransactionMessage),
      [
        { text: i18n.t(k.common.cancel), style: 'cancel' },
        {
          text: i18n.t(k.common.delete),
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  }

  return { requestDelete };
}
