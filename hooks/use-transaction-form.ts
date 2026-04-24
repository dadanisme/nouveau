import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { useAddTransaction } from '@/hooks/use-add-transaction';
import { useSession } from '@/hooks/use-auth';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { useCategories } from '@/hooks/use-categories';
import { useClassifyDescription } from '@/hooks/use-classify-description';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import { useTransaction } from '@/hooks/use-transaction';
import { useUpdateTransaction } from '@/hooks/use-update-transaction';
import type { Tables } from '@/types/supabase';
import { formatDisplayAmount, processAmountKeyPress } from '@/utils/currency';
import { toLocalDateString } from '@/utils/date';

export function useTransactionForm(transactionId?: string, initialDate?: string) {
  const router = useRouter();
  const { session } = useSession();

  const { data: categories = [] } = useCategories(session?.user.id);
  const addTransaction = useAddTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { mutate: classifyDescription } = useClassifyDescription();
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
  const userPickedCategoryRef = useRef(false);
  const lastClassifiedDescriptionRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (isEditMode) return;
    if (userPickedCategoryRef.current) return;

    const trimmed = description.trim();
    if (!trimmed) return;
    if (trimmed === lastClassifiedDescriptionRef.current) return;
    if (!categories.length) return;

    const timer = setTimeout(() => {
      lastClassifiedDescriptionRef.current = trimmed;
      classifyDescription(trimmed, {
        onSuccess: (result) => {
          if (userPickedCategoryRef.current) return;
          const matched = categories.find((c) => c.id === result.category_id);
          if (!matched) return;
          setSelectedCategory(matched);
          if (matched.type === 'income' || matched.type === 'expense') {
            setType(matched.type);
          }
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [description, categories, isEditMode, classifyDescription]);

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
      setAlertState({
        title: i18n.t(k.addTransaction.invalidAmount),
        message: i18n.t(k.addTransaction.invalidAmountMessage),
      });
      return;
    }
    if (!selectedCategory) {
      setAlertState({
        title: i18n.t(k.addTransaction.noCategory),
        message: i18n.t(k.addTransaction.noCategoryMessage),
      });
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
          date: toLocalDateString(date),
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
              title: i18n.t(k.addTransaction.failedToUpdate),
              message: error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
            });
          },
        },
      );
    } else {
      addTransaction.mutate(
        {
          amount,
          category_id: selectedCategory.id,
          date: toLocalDateString(date),
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
              title: i18n.t(k.addTransaction.failedToSave),
              message: error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
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
          title: i18n.t(k.addTransaction.failedToDelete),
          message: error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
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
    userPickedCategoryRef.current = true;
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
