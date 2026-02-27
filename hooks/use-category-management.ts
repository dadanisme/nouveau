import { useMemo, useState } from 'react';

import { useSession } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import { useDeleteCategory } from '@/hooks/use-category-mutations';
import type { Tables } from '@/types/supabase';

export function useCategoryManagement() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: categories = [], isLoading, isRefetching, refetch } = useCategories(userId);
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Tables<'categories'> | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Tables<'categories'> | null>(null);
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories],
  );

  function openAddForm() {
    setEditingCategory(null);
    setShowForm(true);
  }

  function openEditForm(category: Tables<'categories'>) {
    setEditingCategory(category);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
  }

  function confirmDelete(category: Tables<'categories'>) {
    setDeletingCategory(category);
  }

  function executeDelete() {
    if (!deletingCategory || !userId) return;

    deleteCategory.mutate(
      { id: deletingCategory.id, userId },
      {
        onSuccess: () => {
          setDeletingCategory(null);
        },
        onError: (error) => {
          setDeletingCategory(null);
          setAlertState({
            title: 'Failed to Delete',
            message:
              error instanceof Error
                ? error.message
                : 'This category may be in use by transactions.',
          });
        },
      },
    );
  }

  function cancelDelete() {
    setDeletingCategory(null);
  }

  return {
    categories,
    expenseCategories,
    incomeCategories,
    isLoading,
    isRefetching,
    refetch,
    showForm,
    editingCategory,
    deletingCategory,
    alertState,
    isDeleting: deleteCategory.isPending,
    openAddForm,
    openEditForm,
    closeForm,
    confirmDelete,
    executeDelete,
    cancelDelete,
    dismissAlert: () => setAlertState(null),
  };
}
