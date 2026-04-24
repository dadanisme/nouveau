import { useMutation } from '@tanstack/react-query';

import { API_BASE_URL, authenticatedFetch } from '@/lib/api';

const CLASSIFY_API_URL = `${API_BASE_URL}/api/classify-description`;

export interface ClassificationResult {
  type: 'income' | 'expense';
  category_id: string;
  category_name: string;
  reasoning: string;
}

interface ClassifyDescriptionResponse {
  success: boolean;
  data: {
    classification: ClassificationResult;
  };
}

export function useClassifyDescription() {
  return useMutation({
    mutationFn: async (description: string) => {
      const response = await authenticatedFetch<ClassifyDescriptionResponse>(CLASSIFY_API_URL, {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      return response.data.classification;
    },
  });
}
