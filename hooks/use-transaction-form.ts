import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard } from 'react-native';

import { useAddTransaction } from '@/hooks/use-add-transaction';
import { useSession } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import type { Tables } from '@/types/supabase';
import { formatDisplayAmount, processAmountKeyPress } from '@/utils/currency';

export function useTransactionForm() {
  const router = useRouter();
  const { session } = useSession();

  const { data: categories = [] } = useCategories(session?.user.id);
  const addTransaction = useAddTransaction();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Tables<'categories'> | null>(null);
  const [date, setDate] = useState(new Date());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

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

  async function handleSubmit() {
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
          router.back();
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
    isPending: addTransaction.isPending,
    isSubmitDisabled: addTransaction.isPending || !amountString || amountString === '0',
    handleTypeChange,
    handleKeyPress,
    getDisplayAmount,
    handleSubmit,
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
