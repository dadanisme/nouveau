import { useState } from 'react';
import { toast } from 'sonner';

import { useWorkspace } from '@/contexts/workspace-context';
import { useSession } from '@/hooks/use-auth';
import {
  useDeleteTransactions,
  useInsertTransactions,
  useUpdateTransactions,
} from '@/hooks/use-transaction-mutations';
import { en } from '@/locales/en';
import type {
  Category,
  CellEdit,
  DateRange,
  DraftTransaction,
  TransactionCategory,
  TransactionWithCategory,
} from '@/types/transaction';
import { currencyDecimals, parseAmountInput } from '@/utils/currency';
import { formatDate, isDateInRange, parseDateInput } from '@/utils/date';
import { interpolate } from '@/utils/string';
import {
  buildCategoryPatch,
  buildCellPatch,
  buildTransactionFromDraft,
  type DraftResult,
} from '@/utils/transaction';

/** Bulk deletes above this many rows ask for confirmation first. */
const CONFIRM_DELETE_ABOVE = 20;
const UNDO_DURATION_MS = 6000;

const t = en.transactions;

function showError(title: string) {
  return (error: unknown) => {
    toast.error(title, {
      description: error instanceof Error ? error.message : en.common.unexpectedError,
    });
  };
}

function countLabel(count: number, one: string, many: string): string {
  return count === 1 ? one : interpolate(many, { count });
}

/**
 * Everything the transactions page can do to data: inline edits, quick add, bulk category
 * change, and deletes with undo. Wraps the mutation hooks with validation and toasts.
 */
export function useTransactionActions(categories: Category[], visibleRange: DateRange) {
  const { session } = useSession();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const userId = session?.user.id;
  // New transactions are entered in the workspace's home currency, as on mobile.
  const homeCurrency = currentWorkspace?.home_currency;

  const insertTransactions = useInsertTransactions();
  const updateTransactions = useUpdateTransactions();
  const deleteTransactions = useDeleteTransactions();

  const [pendingDelete, setPendingDelete] = useState<TransactionWithCategory[] | null>(null);

  const editCell = (transaction: TransactionWithCategory, edit: CellEdit) => {
    const change = buildCellPatch(transaction, edit);
    if (!change) return;
    updateTransactions.mutate(
      { ids: [transaction.id], ...change },
      { onError: showError(t.updateFailed) },
    );
  };

  const editDate = (transaction: TransactionWithCategory, text: string) => {
    const value = parseDateInput(text, new Date());
    if (!value) {
      toast.error(t.invalidDate);
      return;
    }
    editCell(transaction, { field: 'date', value });
  };

  /** Only reached for home-currency rows; foreign-currency amounts are read-only for now. */
  const editAmount = (transaction: TransactionWithCategory, text: string) => {
    const decimals = currencyDecimals(transaction.currency);
    const value = parseAmountInput(text, decimals);
    if (value === null) {
      toast.error(
        decimals === 0
          ? interpolate(t.invalidAmountWholeOnly, { currency: transaction.currency })
          : t.invalidAmount,
      );
      return;
    }
    editCell(transaction, { field: 'amount', value });
  };

  const changeCategory = (rows: TransactionWithCategory[], category: TransactionCategory) => {
    const ids = rows.filter((row) => row.category_id !== category.id).map((row) => row.id);
    if (ids.length === 0) return;
    updateTransactions.mutate(
      { ids, patch: buildCategoryPatch(category), category },
      { onError: showError(t.updateFailed) },
    );
  };

  /** Returns null when there is no session or workspace to create the transaction in. */
  const createFromDraft = (draft: DraftTransaction): DraftResult | null => {
    if (!userId || !currentWorkspaceId || !homeCurrency) return null;
    const result = buildTransactionFromDraft(draft, {
      id: crypto.randomUUID(),
      userId,
      workspaceId: currentWorkspaceId,
      homeCurrency,
      categories,
      now: new Date(),
    });
    if (!result.ok) {
      showDraftErrors(result);
      return result;
    }

    const { transaction } = result;
    insertTransactions.mutate([transaction], {
      onSuccess: () => {
        if (!isDateInRange(transaction.date, visibleRange)) {
          toast(interpolate(t.savedOutsidePeriod, { date: formatDate(transaction.date) }));
        }
      },
      onError: showError(t.saveFailed),
    });
    return result;
  };

  const restore = (rows: TransactionWithCategory[]) => {
    insertTransactions.mutate(rows, {
      onSuccess: () => toast.success(countLabel(rows.length, t.restoredOne, t.restored)),
      onError: showError(t.restoreFailed),
    });
  };

  const deleteNow = (rows: TransactionWithCategory[]) => {
    if (rows.length === 0) return;
    deleteTransactions.mutate(
      rows.map((row) => row.id),
      {
        onSuccess: () => {
          toast(countLabel(rows.length, t.deletedOne, t.deleted), {
            duration: UNDO_DURATION_MS,
            action: { label: t.undo, onClick: () => restore(rows) },
          });
        },
        onError: showError(t.deleteFailed),
      },
    );
  };

  /** Deletes immediately, or asks first when the selection is large. */
  const requestDelete = (rows: TransactionWithCategory[]) => {
    if (rows.length > CONFIRM_DELETE_ABOVE) setPendingDelete(rows);
    else deleteNow(rows);
  };

  const showDraftErrors = (result: DraftResult) => {
    if (result.ok) return;
    if (result.invalid.includes('date')) toast.error(t.invalidDate);
    else if (result.invalid.includes('amount') && homeCurrency) {
      toast.error(
        currencyDecimals(homeCurrency) === 0
          ? interpolate(t.invalidAmountWholeOnly, { currency: homeCurrency })
          : t.invalidAmount,
      );
    }
  };

  return {
    canCreate: !!userId && !!currentWorkspaceId && !!homeCurrency,
    editDate,
    editDescription: (transaction: TransactionWithCategory, text: string) =>
      editCell(transaction, { field: 'description', value: text }),
    editCategory: (transaction: TransactionWithCategory, category: TransactionCategory) =>
      editCell(transaction, { field: 'category', value: category }),
    editAmount,
    changeCategory,
    createFromDraft,
    requestDelete,
    pendingDeleteCount: pendingDelete?.length ?? 0,
    confirmDelete: () => {
      if (pendingDelete) deleteNow(pendingDelete);
      setPendingDelete(null);
    },
    cancelDelete: () => setPendingDelete(null),
  };
}
