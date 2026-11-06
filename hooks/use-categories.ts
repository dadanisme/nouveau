import { useQuery } from '@tanstack/react-query';

import { requireDataSource, useDataSource } from '@/hooks/use-data-source';
import type { DataSource } from '@/lib/data/types';

export function useCategories(workspaceId: string | null | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['categories', workspaceId],
    queryFn: () => source!.getCategories(workspaceId!),
    enabled: !!source && !!workspaceId,
  });
}

/**
 * How many transactions a category holds, i.e. how many deleting it would also delete (the FK
 * cascades). Fetched fresh at confirm time with `queryClient.fetchQuery`, from `useDataSource()`.
 */
export function categoryTransactionCountQuery(source: DataSource | null, categoryId: string) {
  return {
    queryKey: ['category-transaction-count', categoryId],
    queryFn: () => requireDataSource(source).countCategoryTransactions(categoryId),
    staleTime: 0,
  };
}
