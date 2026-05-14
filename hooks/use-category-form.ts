import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';

import { CATEGORY_COLORS } from '@/constants/category-colors';
import { useWorkspace } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import { useAddCategory, useUpdateCategory } from '@/hooks/use-category-mutations';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';
import { parseIcon } from '@/utils/icon';

interface UseCategoryFormOptions {
  editingCategory: Tables<'categories'> | null;
  onSuccess: () => void;
}

export function useCategoryForm({ editingCategory, onSuccess }: UseCategoryFormOptions) {
  const { session } = useSession();
  const { currentWorkspaceId } = useWorkspace();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type as 'income' | 'expense');
      setColor(editingCategory.color);
      const parsed = editingCategory.icon ? parseIcon(editingCategory.icon) : null;
      setIcon(parsed?.name ?? null);
    } else {
      setName('');
      setType('expense');
      setColor(CATEGORY_COLORS[0]);
      setIcon(null);
    }
  }, [editingCategory]);

  const isPending = addCategory.isPending || updateCategory.isPending;

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setAlertState({
        title: i18n.t(k.categories.invalidName),
        message: i18n.t(k.categories.invalidNameMessage),
      });
      return;
    }

    const userId = session?.user.id;
    if (!currentWorkspaceId || !userId) return;

    const iconValue = icon ? `Ionicons/${icon}` : null;

    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          name: trimmedName,
          type,
          color,
          icon: iconValue,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
          },
          onError: (error) => {
            setAlertState({
              title: i18n.t(k.categories.failedToUpdate),
              message: error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
            });
          },
        },
      );
    } else {
      addCategory.mutate(
        {
          name: trimmedName,
          type,
          color,
          icon: iconValue,
          user_id: userId,
          workspace_id: currentWorkspaceId,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
          },
          onError: (error) => {
            setAlertState({
              title: i18n.t(k.categories.failedToSave),
              message: error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
            });
          },
        },
      );
    }
  }

  function selectIcon(selectedIcon: string) {
    setIcon(selectedIcon);
    setShowIconPicker(false);
  }

  function selectColor(selectedColor: string) {
    setColor(selectedColor);
    setShowColorPicker(false);
  }

  return {
    name,
    type,
    color,
    icon,
    showIconPicker,
    showColorPicker,
    alertState,
    isPending,
    isEditing: !!editingCategory,
    setName,
    setType,
    setColor: selectColor,
    setIcon: selectIcon,
    openIconPicker: () => setShowIconPicker(true),
    closeIconPicker: () => setShowIconPicker(false),
    openColorPicker: () => setShowColorPicker(true),
    closeColorPicker: () => setShowColorPicker(false),
    handleSubmit,
    dismissAlert: () => setAlertState(null),
  };
}
