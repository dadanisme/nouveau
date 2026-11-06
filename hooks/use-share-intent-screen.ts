import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import type { ShareIntentFile } from 'expo-share-intent';
import { useMemo } from 'react';

import { showAlertDialog } from '@/lib/alert-dialog';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { useScanReceipt } from '@/hooks/use-scan-receipt';
import { useSignInPrompt } from '@/hooks/use-sign-in-prompt';

export type CategorizedFile = ShareIntentFile & {
  isImage: boolean;
  isPdf: boolean;
};

/**
 * Screen hook for a share intent: the shared content by kind, Close, and Scan Receipt. Scanning is
 * account only (#100): without a session (a guest, or before onboarding) Scan Receipt opens the
 * sign-in prompt instead. Its Sign In drops the share for Login, and Not Now closes this screen too.
 */
export function useShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const scanReceipt = useScanReceipt();
  const signInPrompt = useSignInPrompt({
    // Drops the share and closes the prompt with this screen, then Login pushes over the tab shell
    // in the same tick. Signed out, the tabs under it never take focus, so their guard's redirect
    // (to Welcome) only runs if the person goes back from Login.
    onSignIn: () => {
      handleDismiss();
      router.push('/login');
    },
    onNotNow: () => handleDismiss(),
  });

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

  /**
   * Back to the tab shell: pops to it (the root Stack anchors it under this screen), or replaces
   * this screen with it when Android's share intent replaced the tabs.
   */
  function handleDismiss() {
    resetShareIntent();
    router.dismissTo('/');
  }

  function handleScanReceipt() {
    signInPrompt.requireAccount('scanReceipt', scan);
  }

  function scan() {
    const scannableFiles = [...imageFiles, ...pdfFiles] as ShareIntentFile[];
    const text = sharedText ?? sharedUrl ?? undefined;

    scanReceipt.mutate(
      { files: scannableFiles, text },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          resetShareIntent();
          router.dismissTo('/');
        },
        onError: (error) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showAlertDialog(
            i18n.t(k.shareIntent.scanFailed),
            error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
          );
        },
      },
    );
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
    handleDismiss,
    handleScanReceipt,
  };
}
