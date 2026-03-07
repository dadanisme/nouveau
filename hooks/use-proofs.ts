import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL, authenticatedFetch } from '@/lib/api';

export interface Proof {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
}

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
