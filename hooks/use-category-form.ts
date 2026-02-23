import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';

import { CATEGORY_COLORS } from '@/constants/category-colors';
import { useAddCategory, useUpdateCategory } from '@/hooks/use-category-mutations';
import { useSession } from '@/hooks/use-auth';
import type { Tables } from '@/types/supabase';
import { parseIcon } from '@/utils/icon';

interface UseCategoryFormOptions {
  editingCategory: Tables<'categories'> | null;
  onSuccess: () => void;
}

export function useCategoryForm({ editingCategory, onSuccess }: UseCategoryFormOptions) {
  const { session } = useSession();
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
      setAlertState({ title: 'Invalid Name', message: 'Please enter a category name.' });
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    const iconValue = icon ? `Ionicons/${icon}` : null;

    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          userId,
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
              title: 'Failed to Update',
              message: error instanceof Error ? error.message : 'An unexpected error occurred.',
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
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess();
          },
          onError: (error) => {
            setAlertState({
              title: 'Failed to Save',
              message: error instanceof Error ? error.message : 'An unexpected error occurred.',
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
