import { useMutation } from '@tanstack/react-query';
import type { ShareIntentFile } from 'expo-share-intent';

import { API_BASE_URL, authenticatedFetch } from '@/lib/api';
import { readFileAsBase64 } from '@/utils/file';

const RECEIPT_API_URL = `${API_BASE_URL}/api/receipts`;

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const MAX_FILES = 5;

interface ScanReceiptInput {
  files: ShareIntentFile[];
  text?: string;
}

interface ScanReceiptResponse {
  data: unknown;
}

export function useScanReceipt() {
  return useMutation({
    mutationFn: async ({ files, text }: ScanReceiptInput) => {
      const scannable = files
        .filter((f) => ALLOWED_MIME_TYPES.includes(f.mimeType))
        .slice(0, MAX_FILES);

      const encoded = await Promise.all(
        scannable.map(async (file) => ({
          data: await readFileAsBase64(file.path),
          mimeType: file.mimeType,
        })),
      );

      return authenticatedFetch<ScanReceiptResponse>(RECEIPT_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          files: encoded,
          ...(text ? { text } : {}),
        }),
      });
    },
  });
}
