import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useCategories } from '@/hooks/use-categories';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useTransactions, useTransactionsByYear } from '@/hooks/use-transactions';
import { formatPeriodLabel, type PeriodMode } from '@/utils/date';
import { parseIntParam } from '@/utils/params';
import { toTransactionRowData } from '@/utils/transaction';

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
 * period's transactions through the same React Query keys as Insights (a cache hit) and lists the
 * category's rows. A tap edits the transaction and View Proofs opens its proofs, each after this
 * sheet closes; Delete confirms natively. Closes itself once the category has no rows left.
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

  // Close once the last row is deleted (only while this sheet is on top, so the pop is its own).
  const closedRef = useRef(false);
  const isEmpty = periodTransactions !== undefined && transactions.length === 0;
  useEffect(() => {
    if (isEmpty && isFocused && !closedRef.current) {
      closedRef.current = true;
      router.back();
    }
  }, [isEmpty, isFocused, router]);

  // One sheet at a time (HIG): Edit Transaction and the proof viewer open once this sheet has
  // closed, instead of over it.
  function openAfterClosing(open: () => void) {
    if (closedRef.current) return;
    closedRef.current = true;
    router.back();
    open();
  }

  function editTransaction(transactionId: string) {
    openAfterClosing(() =>
      router.push({ pathname: '/add-transaction', params: { id: transactionId } }),
    );
  }

  function viewProofs(transactionId: string) {
    openAfterClosing(() => router.push({ pathname: '/proof-viewer', params: { transactionId } }));
  }

  const { requestDelete } = useDeleteConfirmation();

  return {
    categoryName: category?.name ?? transactions[0]?.category.name ?? '',
    periodLabel: formatPeriodLabel(mode, year, month),
    rows: transactions.map((tx) =>
      toTransactionRowData(tx, { showDate: true, showCategory: false }),
    ),
    isLoading: mode === 'month' ? monthQuery.isLoading : yearQuery.isLoading,
    editTransaction,
    viewProofs,
    close: () => router.back(),
    requestDelete,
  };
}
