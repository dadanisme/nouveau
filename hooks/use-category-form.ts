import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';

import { useWorkspace } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import { useCategoryDeleteConfirmation } from '@/hooks/use-category-delete-confirmation';
import { useAddCategory, useUpdateCategory } from '@/hooks/use-category-mutations';
import { useSheetResult } from '@/hooks/use-sheet-result';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';
import type { FormSymbol } from '@/components/native-form-types';
import {
  DEFAULT_CATEGORY_COLOR,
  getCategoryColor,
  getCategorySystemColor,
} from '@/utils/category-color';
import { getIoniconSymbol, toCategoryIconValue } from '@/utils/category-icon';
import { parseIcon } from '@/utils/icon';

export type CategoryFormSheetParams = {
  /** The category to edit; a new category when omitted. */
  id?: string;
};

type CategoryType = 'income' | 'expense';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : i18n.t(k.common.unexpectedError);
}

/**
 * Screen hook for the `category-form` sheet route: add (no `id`) or edit/delete a category.
 *
 * The edited category is read once from the categories cache and seeded into the form, so a later
 * refetch (or the delete itself) never resets what the user typed. The icon and color pickers are
 * sheet routes stacked over this one; their results come back through `useSheetResult`.
 */
export function useCategoryForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<CategoryFormSheetParams>();
  const { session } = useSession();
  const { currentWorkspaceId } = useWorkspace();
  const { data: categories } = useCategories(currentWorkspaceId);
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteConfirmation = useCategoryDeleteConfirmation();

  const [editingCategory, setEditingCategory] = useState<Tables<'categories'> | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [icon, setIcon] = useState<string | null>(null);
  // Only the first close counts, so a double tap can't pop the screen underneath.
  const closedRef = useRef(false);

  // Seed the form once the edited category is in the cache (normally already, from the list).
  const cachedCategory = id ? categories?.find((c) => c.id === id) : undefined;
  if (cachedCategory && !editingCategory) {
    setEditingCategory(cachedCategory);
    setName(cachedCategory.name);
    setType(cachedCategory.type as CategoryType);
    setColor(cachedCategory.color);
    setIcon(cachedCategory.icon ? (parseIcon(cachedCategory.icon)?.name ?? null) : null);
  }

  const iconRequestId = useSheetResult('icon-picker', ({ icon: picked }) => setIcon(picked));
  const colorRequestId = useSheetResult('color-picker', ({ color: picked }) => setColor(picked));

  const isEditing = !!id;
  const isPending =
    addCategory.isPending || updateCategory.isPending || deleteConfirmation.isPending;

  function close() {
    if (closedRef.current) return;
    closedRef.current = true;
    router.back();
  }

  function onSaved() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
  }

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(i18n.t(k.categories.invalidName), i18n.t(k.categories.invalidNameMessage));
      return;
    }

    const userId = session?.user.id;
    if (!currentWorkspaceId || !userId) return;

    const iconValue = toCategoryIconValue(icon);

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, name: trimmedName, type, color, icon: iconValue },
        {
          onSuccess: onSaved,
          onError: (error) => Alert.alert(i18n.t(k.categories.failedToUpdate), errorMessage(error)),
        },
      );
    } else if (!isEditing) {
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
          onSuccess: onSaved,
          onError: (error) => Alert.alert(i18n.t(k.categories.failedToSave), errorMessage(error)),
        },
      );
    }
  }

  /** Native confirmation alert (Cancel + destructive Delete); deleting closes the sheet. */
  function requestDelete() {
    if (!editingCategory) return;
    deleteConfirmation.requestDelete(editingCategory, close);
  }

  function openIconPicker() {
    Keyboard.dismiss();
    router.push({
      pathname: '/icon-picker',
      params: { selected: icon ?? '', color, requestId: iconRequestId },
    });
  }

  function openColorPicker() {
    Keyboard.dismiss();
    router.push({
      pathname: '/color-picker',
      params: { selected: color, requestId: colorRequestId },
    });
  }

  const displayColor = getCategoryColor(color);
  /** The icon row's preview: the picked icon (or the fallback) in the picked color. */
  const iconSymbol: FormSymbol = { ...getIoniconSymbol(icon), color: displayColor };
  /** The color row's preview swatch. */
  const colorSymbol: FormSymbol = { sf: 'circle.fill', material: 'circle', color: displayColor };
  /** Name of the system color the color is shown as (`k.categories.colors.*`). */
  const colorLabelKey = getCategorySystemColor(color)?.labelKey ?? null;

  return {
    name,
    type,
    color,
    icon,
    iconSymbol,
    colorSymbol,
    colorLabelKey,
    isPending,
    isEditing,
    /** Editing, but the category isn't in the cache yet. */
    isLoading: isEditing && !editingCategory,
    setName,
    setType,
    handleSubmit,
    requestDelete,
    openIconPicker,
    openColorPicker,
  };
}
