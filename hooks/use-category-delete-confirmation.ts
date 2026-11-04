import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Alert, Keyboard } from 'react-native';

import { categoryTransactionCountQuery } from '@/hooks/use-categories';
import { useDeleteCategory } from '@/hooks/use-category-mutations';
import { showAlertDialog } from '@/lib/alert-dialog';
import { confirmDestructive } from '@/lib/confirm-destructive';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

function showDeleteError(error: unknown) {
  Alert.alert(
    i18n.t(k.categories.failedToDelete),
    error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
  );
}

/**
 * Delete a category from a list row (swipe / long press) or the category form. Deleting a category
 * also deletes its transactions (the FK cascades), so it counts them first:
 * - none: the destructive confirmation the person expects (an action sheet on iOS);
 * - some: an alert that states the count, with a red "Delete Category and Transactions", because
 *   losing the transactions isn't what the person chose (HIG alerts, feedback).
 * A failed count or delete shows a native error alert.
 */
export function useCategoryDeleteConfirmation() {
  const queryClient = useQueryClient();
  const deleteCategory = useDeleteCategory();

  function deleteNow(id: string, onDeleted?: () => void) {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Its transactions went with it.
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['transactions-year'] });
          onDeleted?.();
        },
        onError: showDeleteError,
      },
    );
  }

  async function requestDelete(category: { id: string; name: string }, onDeleted?: () => void) {
    Keyboard.dismiss();
    let count: number;
    try {
      count = await queryClient.fetchQuery(categoryTransactionCountQuery(category.id));
    } catch (error) {
      showDeleteError(error);
      return;
    }

    if (count === 0) {
      confirmDestructive({
        dialogTitle: i18n.t(k.categories.deleteCategoryPrompt),
        message: i18n.t(k.categories.deleteCategoryMessage),
        confirmLabel: i18n.t(k.categories.deleteCategory),
        onConfirm: () => deleteNow(category.id, onDeleted),
      });
      return;
    }

    showAlertDialog(
      i18n.t(k.categories.deleteCategoryWithTransactionsTitle, { name: category.name }),
      i18n.t(
        count === 1
          ? k.categories.deleteCategoryWithTransactionsMessageOne
          : k.categories.deleteCategoryWithTransactionsMessageOther,
        { count },
      ),
      [
        { text: i18n.t(k.common.cancel), style: 'cancel' },
        {
          text: i18n.t(k.categories.deleteCategoryAndTransactions),
          style: 'destructive',
          onPress: () => deleteNow(category.id, onDeleted),
        },
      ],
    );
  }

  return { requestDelete, isPending: deleteCategory.isPending };
}
