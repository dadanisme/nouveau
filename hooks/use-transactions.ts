import { useQuery } from '@tanstack/react-query';

import { useDataSource } from '@/hooks/use-data-source';

export type { TransactionWithCategory } from '@/lib/data/types';

export function useTransactions(
  workspaceId: string | null | undefined,
  year: number,
  month: number,
  type?: 'income' | 'expense',
) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['transactions', workspaceId, year, month, type ?? 'all'],
    queryFn: () => source!.getTransactions(workspaceId!, year, month, type),
    enabled: !!source && !!workspaceId,
  });
}

export function useTransactionsByYear(
  workspaceId: string | null | undefined,
  year: number,
  enabled = true,
) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['transactions-year', workspaceId, year],
    queryFn: () => source!.getTransactionsByYear(workspaceId!, year),
    enabled: !!source && !!workspaceId && enabled,
  });
}
