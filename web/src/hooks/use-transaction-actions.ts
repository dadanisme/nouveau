import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { useWorkspace } from '@/contexts/workspace-context';
import { useSession } from '@/hooks/use-auth';
import { useDeferredDelete } from '@/hooks/use-deferred-delete';
import { exchangeRateQueryOptions } from '@/hooks/use-exchange-rate';
import { useInsertTransactions, useUpdateTransactions } from '@/hooks/use-transaction-mutations';
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
  RATE_UNAVAILABLE,
  rateNeededFor,
} from '@/utils/transaction';

/** Bulk deletes above this many rows ask for confirmation first. */
const CONFIRM_DELETE_ABOVE = 20;

const t = en.transactions;

function showError(title: string) {
  return (error: unknown) => {
    toast.error(title, {
      description: error instanceof Error ? error.message : en.common.unexpectedError,
    });
  };
}

/**
 * Everything the transactions page can do to data: inline edits, quick add, bulk category
 * change, and deletes with undo (deferred; see `useDeferredDelete`). Wraps the mutation hooks with validation and toasts.
 */
export function useTransactionActions(categories: Category[], visibleRange: DateRange) {
  const { session } = useSession();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const userId = session?.user.id;
  // New transactions are entered in the workspace's home currency, as on mobile.
  const homeCurrency = currentWorkspace?.home_currency;

  const queryClient = useQueryClient();
  const insertTransactions = useInsertTransactions();
  const updateTransactions = useUpdateTransactions();
  const deleteWithUndo = useDeferredDelete();

  const [pendingDelete, setPendingDelete] = useState<TransactionWithCategory[] | null>(null);

  /**
   * The stored exchange rate an edit needs, if any. A failed lookup counts as "no rate", so
   * the edit falls back to the implied rate exactly as when the table has no rate (mobile
   * does the same: its rate query's error leaves the rate undefined).
   */
  const lookUpRate = async (
    transaction: TransactionWithCategory,
    edit: CellEdit,
  ): Promise<number | null> => {
    const needed = rateNeededFor(transaction, edit);
    if (!needed) return null;
    try {
      return await queryClient.fetchQuery(
        exchangeRateQueryOptions(needed.from, needed.to, needed.date),
      );
    } catch {
      return null;
    }
  };

  const editCell = async (transaction: TransactionWithCategory, edit: CellEdit) => {
    const change = buildCellPatch(transaction, edit, await lookUpRate(transaction, edit));
    if (!change) return;
    if (change === RATE_UNAVAILABLE) {
      toast.error(t.rateUnavailable, { description: t.rateUnavailableMessage });
      return;
    }
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
    void editCell(transaction, { field: 'date', value });
  };

  /** The amount is typed in the transaction's own currency; the home amount follows. */
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
    void editCell(transaction, { field: 'amount', value });
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

  /**
   * Removes the rows from view and queues the DELETE behind an Undo toast (see
   * `useDeferredDelete`); asks first when the selection is large.
   */
  const requestDelete = (rows: TransactionWithCategory[]) => {
    if (rows.length > CONFIRM_DELETE_ABOVE) setPendingDelete(rows);
    else deleteWithUndo(rows);
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
      void editCell(transaction, { field: 'description', value: text }),
    editCategory: (transaction: TransactionWithCategory, category: TransactionCategory) =>
      void editCell(transaction, { field: 'category', value: category }),
    editAmount,
    editCurrency: (transaction: TransactionWithCategory, currency: string) =>
      void editCell(transaction, { field: 'currency', value: currency }),
    changeCategory,
    createFromDraft,
    requestDelete,
    pendingDeleteCount: pendingDelete?.length ?? 0,
    confirmDelete: () => {
      if (pendingDelete) deleteWithUndo(pendingDelete);
      setPendingDelete(null);
    },
    cancelDelete: () => setPendingDelete(null),
  };
}
