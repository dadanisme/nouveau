import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL, authenticatedFetch } from '@/lib/api';

/** A receipt proof as the API returns it. `url` is ready to load (the API signs it). */
export interface Proof {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
}

/** Proofs attached to a transaction (same endpoint and query key as mobile). */
export function useProofs(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['proofs', transactionId],
    queryFn: async () => {
      const response = await authenticatedFetch<{ success: boolean; data: Proof[] }>(
        `${API_BASE_URL}/api/proofs/${transactionId}`,
      );
      return response.data;
    },
    enabled: !!transactionId,
  });
}
