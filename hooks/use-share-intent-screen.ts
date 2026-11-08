import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import type { ShareIntentFile } from 'expo-share-intent';
import { useMemo } from 'react';

import { showAlertDialog } from '@/lib/alert-dialog';
import i18n from '@/lib/i18n';
import { leaveToHome } from '@/lib/navigation';
import { k } from '@/locales/keys';
import { useGuestSession } from '@/hooks/use-auth';
import { useScanReceipt } from '@/hooks/use-scan-receipt';
import { useRequirePremium } from '@/hooks/use-require-premium';
import { isPremiumRequiredError } from '@/utils/premium';

export type CategorizedFile = ShareIntentFile & {
  isImage: boolean;
  isPdf: boolean;
};

/**
 * Screen hook for a share intent: the shared content by kind, Close, and Scan Receipt. Scanning is
 * Premium (#79, `useRequirePremium`): a free account gets the paywall, and buying there scans
 * right away; a server `premium_required` refusal opens it too. It's also account only (#100):
 * without a session (a guest, or before onboarding) Scan Receipt opens the sign-in prompt instead. Its Sign In drops the share for Login. Its Not Now leaves a guest here,
 * and closes this screen too when nobody is signed in (there's nothing else to do with the share).
 */
export function useShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const scanReceipt = useScanReceipt();
  const { guestId } = useGuestSession();
  const premiumGate = useRequirePremium({
    // Drops the share and closes the prompt with this screen, then Login pushes over home in the
    // same tick: the tab shell for a guest, the signed-out start (Welcome) otherwise.
    onSignIn: () => {
      handleDismiss();
      router.push('/login');
    },
    // A guest keeps the share screen (the default just closes the prompt).
    onNotNow: guestId ? undefined : () => handleDismiss(),
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
   * Home (`leaveToHome`): the tab shell, or signed out the value pages or Welcome, with nothing
   * left behind. Resetting a share leaves through the provider's `onResetShareIntent`, so it's
   * called once; with no share left (the empty state) there's no reset, so it leaves directly.
   */
  function handleDismiss() {
    if (hasShareIntent) resetShareIntent();
    else leaveToHome();
  }

  function handleScanReceipt() {
    premiumGate.requirePremium('scanReceipt', scan);
  }

  function scan() {
    const scannableFiles = [...imageFiles, ...pdfFiles] as ShareIntentFile[];
    const text = sharedText ?? sharedUrl ?? undefined;

    scanReceipt.mutate(
      { files: scannableFiles, text },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Leaves through the provider's `onResetShareIntent` (`leaveToHome`).
          resetShareIntent();
        },
        onError: (error) => {
          // Premium lapsed, or the status hadn't loaded: the paywall, then the scan again.
          if (isPremiumRequiredError(error)) {
            premiumGate.openPaywall('scanReceipt', scan);
            return;
          }
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
