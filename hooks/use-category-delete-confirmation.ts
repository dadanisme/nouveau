import * as Haptics from 'expo-haptics';
import { Alert, Keyboard } from 'react-native';

import { useDeleteCategory } from '@/hooks/use-category-mutations';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/**
 * Delete a category behind a native confirmation alert (Cancel + destructive Delete), from a list
 * row (swipe / long press) or the category form. A failed delete shows a native error alert.
 */
export function useCategoryDeleteConfirmation() {
  const deleteCategory = useDeleteCategory();

  function deleteNow(id: string, onDeleted?: () => void) {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDeleted?.();
        },
        onError: (error) =>
          Alert.alert(
            i18n.t(k.categories.failedToDelete),
            error instanceof Error ? error.message : i18n.t(k.categories.deleteInUseMessage),
          ),
      },
    );
  }

  function requestDelete(category: { id: string; name: string }, onDeleted?: () => void) {
    Keyboard.dismiss();
    Alert.alert(
      i18n.t(k.categories.deleteCategory),
      i18n.t(k.categories.deleteCategoryMessage, { name: category.name }),
      [
        { text: i18n.t(k.common.cancel), style: 'cancel' },
        {
          text: i18n.t(k.common.delete),
          style: 'destructive',
          onPress: () => deleteNow(category.id, onDeleted),
        },
      ],
    );
  }

  return { requestDelete, isPending: deleteCategory.isPending };
}
