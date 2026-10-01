import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useEffectEvent } from 'react';

import { useWorkspace } from '@/contexts/workspace-context';
import { useTransaction } from '@/hooks/use-transaction';
import type { TransactionWithCategory } from '@/types/transaction';
import { isEditableTarget } from '@/utils/dom';

const route = getRouteApi('/_app/');

/**
 * The side panel's state. Which transaction is open lives in the URL (`?tx=<id>`), so it
 * survives a reload and the back button closes it. The record comes from the loaded period
 * when it is there, and is fetched on its own otherwise (after a reload on another month, or
 * once a date edit moves it out of the period).
 */
export function useTransactionPanel(
  periodTransactions: TransactionWithCategory[],
  isPeriodLoading: boolean,
) {
  const { tx: openId } = route.useSearch();
  const navigate = route.useNavigate();
  const { currentWorkspaceId } = useWorkspace();

  const listed = openId ? periodTransactions.find((tx) => tx.id === openId) : undefined;
  const single = useTransaction(currentWorkspaceId, openId, !listed && !isPeriodLoading);
  const transaction = listed ?? single.data ?? null;

  const open = (id: string) => void navigate({ search: (prev) => ({ ...prev, tx: id }) });
  const close = () => void navigate({ search: (prev) => ({ ...prev, tx: undefined }) });

  // Escape closes the panel, unless it belongs to something else: a field being edited, or
  // a menu, popover or dialog (Radix marks the event as handled when it closes one).
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (isEditableTarget(event.target)) return;
    if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
    close();
  });

  const isOpen = !!openId;
  useEffect(() => {
    if (!isOpen) return;
    const listener = (event: KeyboardEvent) => onEscape(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [isOpen]);

  return {
    openId: openId ?? null,
    isOpen,
    transaction,
    isLoading: !transaction && (isPeriodLoading || single.isPending),
    error: transaction ? null : single.error,
    open,
    close,
  };
}
