import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import type { ShareIntentFile } from 'expo-share-intent';
import { useMemo, useState } from 'react';

import { useScanReceipt } from '@/hooks/use-scan-receipt';

export type CategorizedFile = ShareIntentFile & {
  isImage: boolean;
  isPdf: boolean;
};

export function useShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const scanReceipt = useScanReceipt();

  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

  const sharedText = shareIntent.text ?? null;
  const sharedUrl = shareIntent.webUrl ?? null;

  const { imageFiles, pdfFiles, otherFiles } = useMemo(() => {
    const images: CategorizedFile[] = [];
    const pdfs: CategorizedFile[] = [];
    const others: CategorizedFile[] = [];

    for (const file of shareIntent.files ?? []) {
      const isImage = file.mimeType.startsWith('image/');
      const isPdf = file.mimeType === 'application/pdf';
      const categorized: CategorizedFile = { ...file, isImage, isPdf };

      if (isImage) images.push(categorized);
      else if (isPdf) pdfs.push(categorized);
      else others.push(categorized);
    }

    return { imageFiles: images, pdfFiles: pdfs, otherFiles: others };
  }, [shareIntent.files]);

  const canScan = imageFiles.length > 0 || pdfFiles.length > 0;
  const isScanning = scanReceipt.isPending;

  function handleDismiss() {
    resetShareIntent();
    router.replace('/');
  }

  function handleScanReceipt() {
    const scannableFiles = [...imageFiles, ...pdfFiles] as ShareIntentFile[];
    const text = sharedText ?? sharedUrl ?? undefined;

    scanReceipt.mutate(
      { files: scannableFiles, text },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          resetShareIntent();
          router.replace('/');
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setAlertState({
            title: 'Scan Failed',
            message: error instanceof Error ? error.message : 'An unexpected error occurred.',
          });
        },
      },
    );
  }

  function dismissAlert() {
    setAlertState(null);
  }

  return {
    hasShareIntent,
    sharedText,
    sharedUrl,
    imageFiles,
    pdfFiles,
    otherFiles,
    canScan,
    isScanning,
    alertState,
    handleDismiss,
    handleScanReceipt,
    dismissAlert,
  };
}
