import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { usePremium } from '@/hooks/use-premium';
import { useRestorePurchases } from '@/hooks/use-purchases';
import { showAlertDialog } from '@/lib/alert-dialog';
import { openSubscriptionManagement, toEntitlementSnapshot } from '@/lib/purchases';
import { k } from '@/locales/keys';
import { formatMediumDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/error';
import { getPremiumStatusLabels, getStoreNameKey } from '@/utils/premium';

/**
 * Screen hook for Settings' Premium (#79): the status (Free, Premium Monthly / Yearly with its
 * trial, renewal or expiry date, or an admin grant), Upgrade (opens the paywall) while free,
 * Manage Subscription (the store's own management) for a store subscription, and Restore
 * Purchases. Pull to refresh re-reads the status.
 */
export function usePremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const premium = usePremium();
  const restore = useRestorePurchases();
  const storeName = t(getStoreNameKey(Platform.OS));
  const labels = getPremiumStatusLabels(premium.status, formatMediumDate);

  function restorePurchases() {
    if (restore.isPending) return;
    restore.mutate(undefined, {
      // Restored, the status row changes; nothing found is said.
      onSuccess: (info) => {
        if (toEntitlementSnapshot(info)?.isActive) return;
        showAlertDialog(
          t(k.premium.nothingToRestore),
          t(k.premium.nothingToRestoreMessage, { store: storeName }),
        );
      },
      onError: (error) =>
        showAlertDialog(
          t(k.premium.restoreFailed),
          getErrorMessage(error, t(k.common.unexpectedError)),
        ),
    });
  }

  return {
    isLoading: premium.isLoading,
    hasError: premium.hasError,
    statusTitle: t(labels.title.key, labels.title.params),
    statusDetail: labels.detail ? t(labels.detail.key, labels.detail.params) : undefined,
    canUpgrade: !premium.isActive,
    upgrade: () => router.push({ pathname: '/paywall', params: { source: 'settings' } }),
    canManage: premium.status.kind === 'store',
    manageFooter: t(k.premium.manageFooter, { store: storeName }),
    manage: () => void openSubscriptionManagement(),
    isAvailable: premium.isAvailable,
    restoreLabel: restore.isPending ? t(k.premium.restoring) : t(k.premium.restore),
    isRestoring: restore.isPending,
    restorePurchases,
    refresh: premium.refresh,
  };
}
