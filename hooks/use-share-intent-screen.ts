import { useShareIntentContext } from 'expo-share-intent';
import type { ShareIntentFile } from 'expo-share-intent';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

export type CategorizedFile = ShareIntentFile & {
  isImage: boolean;
  isPdf: boolean;
};

export function useShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

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

  const handleDismiss = () => {
    resetShareIntent();
    router.replace('/');
  };

  return {
    hasShareIntent,
    sharedText,
    sharedUrl,
    imageFiles,
    pdfFiles,
    otherFiles,
    handleDismiss,
  };
}
