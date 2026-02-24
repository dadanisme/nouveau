import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import { useAddTransaction } from '@/hooks/use-add-transaction';
import { useSession } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import { useTransaction } from '@/hooks/use-transaction';
import { useUpdateTransaction } from '@/hooks/use-update-transaction';
import type { Tables } from '@/types/supabase';
import { formatDisplayAmount, processAmountKeyPress } from '@/utils/currency';

export function useTransactionForm(transactionId?: string, initialDate?: string) {
  const router = useRouter();
  const { session } = useSession();

  const { data: categories = [] } = useCategories(session?.user.id);
  const addTransaction = useAddTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { data: existingTransaction, isLoading: isLoadingTransaction } =
    useTransaction(transactionId);

  const isEditMode = !!transactionId;

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Tables<'categories'> | null>(null);
  const [date, setDate] = useState(initialDate ? new Date(initialDate + 'T00:00:00') : new Date());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Pre-fill form when editing an existing transaction
  useEffect(() => {
    if (!existingTransaction || !categories.length || prefilled) return;

    setType(existingTransaction.type as 'income' | 'expense');
    setAmountString(String(existingTransaction.amount));
    setDescription(existingTransaction.description ?? '');
    setDate(new Date(existingTransaction.date.split('T')[0] + 'T00:00:00'));

    const matchedCategory = categories.find((c) => c.id === existingTransaction.category_id);
    if (matchedCategory) setSelectedCategory(matchedCategory);

    setPrefilled(true);
  }, [existingTransaction, categories, prefilled]);

  function handleTypeChange(newType: 'income' | 'expense') {
    setType(newType);
    setSelectedCategory((prev) => (prev && prev.type !== newType ? null : prev));
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleKeyPress(key: string) {
    Keyboard.dismiss();
    if (key === 'backspace') {
      setAmountString((prev) => prev.slice(0, -1));
      return;
    }
    setAmountString((prev) => processAmountKeyPress(prev, key));
  }

  function getDisplayAmount(): string {
    return formatDisplayAmount(amountString);
  }

  function resetForm() {
    setAmountString('');
    setDescription('');
    setSelectedCategory(null);
  }

  async function handleSubmit(mode: 'save' | 'add-more' = 'save') {
    const amount = parseFloat(amountString);
    if (!amount || amount <= 0) {
      setAlertState({ title: 'Invalid Amount', message: 'Please enter a valid amount.' });
      return;
    }
    if (!selectedCategory) {
      setAlertState({ title: 'No Category', message: 'Please select a category.' });
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    if (isEditMode) {
      updateTransaction.mutate(
        {
          id: transactionId,
          amount,
          category_id: selectedCategory.id,
          date: date.toISOString().split('T')[0],
          description: description.trim() || null,
          type,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
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
      addTransaction.mutate(
        {
          amount,
          category_id: selectedCategory.id,
          date: date.toISOString().split('T')[0],
          description: description.trim() || null,
          type,
          user_id: userId,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (mode === 'add-more') {
              resetForm();
            } else {
              router.back();
            }
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

  function handleDelete() {
    if (!transactionId) return;

    deleteTransaction.mutate(transactionId, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
      onError: (error) => {
        setAlertState({
          title: 'Failed to Delete',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      },
    });
  }

  function openCategoryPicker() {
    Keyboard.dismiss();
    setShowCategoryPicker(true);
  }

  function closeCategoryPicker() {
    setShowCategoryPicker(false);
  }

  function selectCategory(category: Tables<'categories'>) {
    setSelectedCategory(category);
    setShowCategoryPicker(false);
  }

  function openDatePicker() {
    Keyboard.dismiss();
    setShowDatePicker(true);
  }

  function closeDatePicker() {
    setShowDatePicker(false);
  }

  function selectDate(selectedDate: Date) {
    setDate(selectedDate);
    setShowDatePicker(false);
  }

  function dismissAlert() {
    setAlertState(null);
  }

  return {
    type,
    amountString,
    description,
    selectedCategory,
    date,
    showCategoryPicker,
    showDatePicker,
    alertState,
    filteredCategories,
    isPending: addTransaction.isPending || updateTransaction.isPending,
    isSubmitDisabled:
      addTransaction.isPending ||
      updateTransaction.isPending ||
      !amountString ||
      amountString === '0',
    isEditMode,
    isDeleting: deleteTransaction.isPending,
    isLoadingTransaction,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleTypeChange,
    handleKeyPress,
    getDisplayAmount,
    handleSubmit,
    handleDelete,
    setDescription,
    openCategoryPicker,
    closeCategoryPicker,
    selectCategory,
    openDatePicker,
    closeDatePicker,
    selectDate,
    dismissAlert,
    goBack: () => router.back(),
  };
}
