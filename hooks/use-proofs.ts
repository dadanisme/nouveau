import { useQuery } from '@tanstack/react-query';

import { useDataSource } from '@/hooks/use-data-source';
import { API_BASE_URL, authenticatedFetch } from '@/lib/api';

export interface Proof {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
}

/** A transaction's receipt proofs. Account only: a guest's transactions have none. */
export function useProofs(transactionId: string | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['proofs', transactionId],
    queryFn: async () => {
      const response = await authenticatedFetch<{ success: boolean; data: Proof[] }>(
        `${API_BASE_URL}/api/proofs/${transactionId}`,
      );
      return response.data;
    },
    enabled: source?.kind === 'remote' && !!transactionId,
  });
}
