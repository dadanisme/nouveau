import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useAddTransaction } from '@/hooks/use-add-transaction';
import { useSession } from '@/hooks/use-auth';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { useCategories } from '@/hooks/use-categories';
import { useClassifyDescription } from '@/hooks/use-classify-description';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
import { useSheetResult } from '@/hooks/use-sheet-result';
import { useTransaction } from '@/hooks/use-transaction';
import { useUpdateTransaction } from '@/hooks/use-update-transaction';
import type { Tables } from '@/types/supabase';
import type { FormSymbol } from '@/components/native-form-types';
import { getCategoryColor } from '@/utils/category-color';
import { FALLBACK_CATEGORY_SYMBOL, getCategorySymbol } from '@/utils/category-icon';
import {
  currencyDecimals,
  getAmountPrefix,
  getAmountSeparators,
  isPositiveAmount,
} from '@/utils/currency';
import { toLocalDateString } from '@/utils/date';

type TransactionType = 'income' | 'expense';

function isTransactionType(value: string): value is TransactionType {
  return value === 'income' || value === 'expense';
}

/** What the form would save, to tell whether it has unsaved changes. */
function formSnapshot(
  type: TransactionType,
  amountString: string,
  description: string,
  categoryId: string | null,
  date: Date,
): string {
  // Compare the amount as a number: the field may regroup its text without changing the value.
  const amount = parseFloat(amountString) || 0;
  return [type, amount, description.trim(), categoryId ?? '', toLocalDateString(date)].join('|');
}

function showError(title: string, error: unknown) {
  Alert.alert(title, error instanceof Error ? error.message : i18n.t(k.common.unexpectedError));
}

export function useTransactionForm(transactionId?: string, initialDate?: string) {
  const router = useRouter();
  const { session } = useSession();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const { locale } = useLanguage();

  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories(currentWorkspaceId);
  const addTransaction = useAddTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const { mutate: classifyDescription } = useClassifyDescription();
  const { data: existingTransaction, isLoading: isLoadingTransaction } =
    useTransaction(transactionId);

  const isEditMode = !!transactionId;

  // New transactions are entered in the workspace's home currency; edits keep
  // the transaction's original currency (amounts are re-converted on save).
  const homeCurrency = existingTransaction?.home_currency ?? currentWorkspace?.home_currency;
  const txCurrency = existingTransaction?.currency ?? homeCurrency;
  const isForeignCurrency = !!txCurrency && !!homeCurrency && txCurrency !== homeCurrency;
  const foreignCurrency = isForeignCurrency ? txCurrency : undefined;

  const [type, setType] = useState<TransactionType>('expense');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Tables<'categories'> | null>(null);
  const [date, setDate] = useState(initialDate ? new Date(initialDate + 'T00:00:00') : new Date());
  const [prefilled, setPrefilled] = useState(false);
  // The amount field owns its (grouped) text natively; bumping this reloads it from the form after
  // the form sets the amount itself (edit prefill, "add more" reset).
  const [fieldsKey, setFieldsKey] = useState(0);
  // The values the form started from (or was last reset to); anything else is unsaved.
  const [baseline, setBaseline] = useState(() =>
    formSnapshot(type, amountString, description, null, date),
  );
  const userPickedCategoryRef = useRef(false);
  const lastClassifiedDescriptionRef = useRef<string | null>(null);

  // The picker lists every category grouped by type, so picking one sets the type to match.
  const categoryRequestId = useSheetResult('category-picker', ({ category }) => {
    userPickedCategoryRef.current = true;
    setSelectedCategory(category);
    if (isTransactionType(category.type)) setType(category.type);
  });

  // Prefetched so the rate is ready by the time a foreign-currency edit is saved
  const { data: exchangeRate } = useExchangeRate(
    isForeignCurrency ? txCurrency : undefined,
    isForeignCurrency ? homeCurrency : undefined,
    toLocalDateString(date),
  );

  // Pre-fill form when editing an existing transaction
  useEffect(() => {
    if (!existingTransaction || !categories.length || prefilled) return;

    setType(existingTransaction.type as TransactionType);
    setAmountString(String(existingTransaction.amount));
    setDescription(existingTransaction.description ?? '');
    setDate(new Date(existingTransaction.date.split('T')[0] + 'T00:00:00'));

    const matchedCategory = categories.find((c) => c.id === existingTransaction.category_id);
    if (matchedCategory) setSelectedCategory(matchedCategory);
    setBaseline(
      formSnapshot(
        existingTransaction.type as TransactionType,
        String(existingTransaction.amount),
        existingTransaction.description ?? '',
        matchedCategory?.id ?? null,
        new Date(existingTransaction.date.split('T')[0] + 'T00:00:00'),
      ),
    );

    setPrefilled(true);
    setFieldsKey((key) => key + 1);
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
          if (isTransactionType(matched.type)) setType(matched.type);
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [description, categories, isEditMode, classifyDescription]);

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    setSelectedCategory((prev) => (prev && prev.type !== newType ? null : prev));
  }

  function resetForm() {
    setAmountString('');
    setDescription('');
    setSelectedCategory(null);
    setBaseline(formSnapshot(type, '', '', null, date));
    setFieldsKey((key) => key + 1);
  }

  const isDirty =
    formSnapshot(type, amountString, description, selectedCategory?.id ?? null, date) !== baseline;
  // Swipe-down, Cancel and Back confirm before dropping unsaved changes.
  const leave = useDiscardGuard(isDirty);

  async function handleSubmit(mode: 'save' | 'add-more' = 'save') {
    const amount = parseFloat(amountString);
    if (!amount || amount <= 0) {
      Alert.alert(
        i18n.t(k.addTransaction.invalidAmount),
        i18n.t(k.addTransaction.invalidAmountMessage),
      );
      return;
    }
    if (!selectedCategory) {
      Alert.alert(i18n.t(k.addTransaction.noCategory), i18n.t(k.addTransaction.noCategoryMessage));
      return;
    }

    const userId = session?.user.id;
    if (!currentWorkspaceId || !userId) return;

    // Foreign-currency edits keep the original currency and re-convert the
    // home amount: prefer a stored exchange rate for the selected date, fall
    // back to the rate implied by the existing conversion.
    let homeAmount = amount;
    if (isEditMode && isForeignCurrency && existingTransaction) {
      const impliedRate =
        existingTransaction.amount > 0
          ? existingTransaction.home_amount / existingTransaction.amount
          : null;
      const rate = exchangeRate ?? impliedRate;
      if (!rate) {
        Alert.alert(
          i18n.t(k.addTransaction.rateUnavailable),
          i18n.t(k.addTransaction.rateUnavailableMessage),
        );
        return;
      }
      homeAmount = amount * rate;
    }

    if (isEditMode) {
      updateTransaction.mutate(
        {
          id: transactionId,
          amount,
          home_amount: homeAmount,
          category_id: selectedCategory.id,
          date: toLocalDateString(date),
          description: description.trim() || null,
          type,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            leave(() => router.back());
          },
          onError: (error) => {
            showError(i18n.t(k.addTransaction.failedToUpdate), error);
          },
        },
      );
    } else {
      addTransaction.mutate(
        {
          amount,
          home_amount: amount,
          ...(homeCurrency ? { currency: homeCurrency, home_currency: homeCurrency } : {}),
          category_id: selectedCategory.id,
          date: toLocalDateString(date),
          description: description.trim() || null,
          type,
          user_id: userId,
          workspace_id: currentWorkspaceId,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (mode === 'add-more') {
              resetForm();
            } else {
              leave(() => router.back());
            }
          },
          onError: (error) => {
            showError(i18n.t(k.addTransaction.failedToSave), error);
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
        leave(() => router.back());
      },
      onError: (error) => {
        showError(i18n.t(k.addTransaction.failedToDelete), error);
      },
    });
  }

  function confirmDelete() {
    Alert.alert(
      i18n.t(k.addTransaction.deleteTransaction),
      i18n.t(k.addTransaction.deleteTransactionMessage),
      [
        { text: i18n.t(k.common.cancel), style: 'cancel' },
        { text: i18n.t(k.common.delete), style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  // iOS pushes what the sheet opens inside the sheet's own Stack (one sheet at a time, HIG);
  // Android keeps the modal and picker sheet over its full-screen modal.
  function openProofs() {
    if (!transactionId) return;
    router.push({
      pathname: Platform.OS === 'ios' ? '/add-transaction/proofs' : '/proof-viewer',
      params: { transactionId },
    });
  }

  function openCategoryPicker() {
    Keyboard.dismiss();
    router.push({
      pathname: Platform.OS === 'ios' ? '/add-transaction/category-picker' : '/category-picker',
      params: {
        currentType: type,
        selectedId: selectedCategory?.id ?? '',
        requestId: categoryRequestId,
      },
    });
  }

  const isPending = addTransaction.isPending || updateTransaction.isPending;
  const isDeleting = deleteTransaction.isPending;
  const isValid = isPositiveAmount(amountString) && !!selectedCategory;

  // Edit mode shows a placeholder until the transaction is seeded into the form.
  const isLoadingForm =
    isEditMode &&
    !prefilled &&
    (isLoadingTransaction ||
      isLoadingCategories ||
      (!!existingTransaction && categories.length > 0));

  // The category row always has a glyph (a placeholder until one is picked): a Compose list row
  // doesn't pick up a leading slot added after it first rendered.
  const categorySymbol: FormSymbol = selectedCategory
    ? {
        ...getCategorySymbol(selectedCategory.icon),
        color: getCategoryColor(selectedCategory.color),
      }
    : FALLBACK_CATEGORY_SYMBOL;

  return {
    type,
    amountString,
    description,
    selectedCategory,
    categorySymbol,
    date,
    /** Minor units the amount accepts (0 for e.g. IDR). */
    amountDecimals: txCurrency ? currencyDecimals(txCurrency) : 0,
    /** Shown before the amount: the locale prefix, or a foreign currency's symbol. */
    amountPrefix: getAmountPrefix(foreignCurrency),
    /** How the amount is grouped as it's typed: like the app shows that currency. */
    amountSeparators: getAmountSeparators(foreignCurrency, locale),
    fieldsKey,
    isPending,
    isSubmitDisabled: isPending || isDeleting || !isValid,
    isEditMode,
    isDeleting,
    isLoadingForm,
    handleTypeChange,
    setAmountString,
    setDate,
    handleSubmit,
    handleDelete,
    setDescription,
    confirmDelete,
    /** Cancel: leaves the form; unsaved changes are confirmed first. */
    cancel: () => router.back(),
    openProofs,
    openCategoryPicker,
  };
}
