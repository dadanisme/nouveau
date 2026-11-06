import { useQuery } from '@tanstack/react-query';

import { useDataSource } from '@/hooks/use-data-source';

export function useTransaction(id: string | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => source!.getTransaction(id!),
    enabled: !!source && !!id,
  });
}
