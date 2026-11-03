import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useSheetResult } from '@/hooks/use-sheet-result';
import {
  useTransactions,
  useTransactionsByYear,
  type TransactionWithCategory,
} from '@/hooks/use-transactions';
import { useUpdateTransaction } from '@/hooks/use-update-transaction';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { formatPeriodLabel, type PeriodMode } from '@/utils/date';
import { parseIntParam } from '@/utils/params';

export interface CategoryTransactionsSheetParams {
  categoryId: string;
  /** `month` or `year`: the Insights period the drill-down was opened from. */
  mode: PeriodMode;
  year: string;
  /** 0-based month; ignored in year mode. */
  month: string;
}

/**
 * Screen hook for the `category-transactions` sheet route (Insights drill-down). Re-reads the
 * period's transactions through the same React Query keys as Insights (a cache hit), lists the
 * category's rows, recategorizes a row through the `category-picker` sheet, and deletes behind a
 * native confirmation. Closes itself once the category has no rows left in the period.
 */
export function useCategoryTransactionsSheet() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams<Partial<CategoryTransactionsSheetParams>>();
  const mode: PeriodMode = params.mode === 'year' ? 'year' : 'month';
  const now = new Date();
  const year = parseIntParam(params.year) ?? now.getFullYear();
  const month = parseIntParam(params.month) ?? now.getMonth();
  const categoryId = params.categoryId ?? null;

  const { currentWorkspaceId } = useWorkspace();
  const monthQuery = useTransactions(mode === 'month' ? currentWorkspaceId : null, year, month);
  const yearQuery = useTransactionsByYear(currentWorkspaceId, year, mode === 'year');
  const periodTransactions = mode === 'month' ? monthQuery.data : yearQuery.data;

  const { data: categories = [] } = useCategories(currentWorkspaceId);
  const category = categories.find((c) => c.id === categoryId) ?? null;

  const transactions = useMemo(
    () => periodTransactions?.filter((tx) => tx.category.id === categoryId) ?? [],
    [periodTransactions, categoryId],
  );

  // Close once the last row is recategorized or deleted. Wait until this sheet is on top again,
  // so a closing category picker isn't the one that gets popped.
  const closedRef = useRef(false);
  const isEmpty = periodTransactions !== undefined && transactions.length === 0;
  useEffect(() => {
    if (isEmpty && isFocused && !closedRef.current) {
      closedRef.current = true;
      router.back();
    }
  }, [isEmpty, isFocused, router]);

  const updateTransaction = useUpdateTransaction();
  const recategorizeTargetRef = useRef<TransactionWithCategory | null>(null);

  const categoryPickerRequestId = useSheetResult('category-picker', ({ category: picked }) => {
    const target = recategorizeTargetRef.current;
    recategorizeTargetRef.current = null;
    if (!target || picked.id === target.category.id) return;
    updateTransaction.mutate(
      { id: target.id, category_id: picked.id },
      {
        onError: (error) => {
          Alert.alert(
            i18n.t(k.addTransaction.failedToUpdate),
            error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
          );
        },
      },
    );
  });

  function recategorize(transaction: TransactionWithCategory) {
    recategorizeTargetRef.current = transaction;
    router.push({
      pathname: '/category-picker',
      params: {
        type: transaction.type,
        selectedId: transaction.category.id,
        requestId: categoryPickerRequestId,
      },
    });
  }

  function viewProofs(transactionId: string) {
    router.push({ pathname: '/proof-viewer', params: { transactionId } });
  }

  const { requestDelete } = useDeleteConfirmation();

  return {
    categoryName: category?.name ?? transactions[0]?.category.name ?? '',
    categoryColor: category?.color ?? transactions[0]?.category.color,
    periodLabel: formatPeriodLabel(mode, year, month),
    transactions,
    isLoading: mode === 'month' ? monthQuery.isLoading : yearQuery.isLoading,
    recategorize,
    viewProofs,
    requestDelete,
  };
}
