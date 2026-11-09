import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSession } from '@/hooks/use-auth';
import { usePremium } from '@/hooks/use-premium';
import { usePremiumOffering, useRestorePurchases } from '@/hooks/use-purchases';
import { useRequireAiConsent } from '@/hooks/use-require-ai-consent';
import { showAlertDialog } from '@/lib/alert-dialog';
import { openLegalPage } from '@/lib/legal';
import { openSubscriptionManagement, toEntitlementSnapshot } from '@/lib/purchases';
import { k } from '@/locales/keys';
import { getToggleAction, isAiProcessingOn } from '@/utils/ai-consent';
import { formatMediumDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/error';
import { getPlanPriceKey, getPremiumStatusLabels, getStoreNameKey } from '@/utils/premium';

/**
 * Screen hook for Settings' Premium (#79): the status (Free, Premium Monthly / Yearly with its
 * trial, renewal or expiry date, or an admin grant), Upgrade (opens the paywall) while free,
 * Manage Subscription (the store's own management) for a store subscription, and Restore
 * Purchases. Pull to refresh, or Try Again when the status failed to load, re-reads it (and
 * identifies RevenueCat as the account again when that failed). Signed in, it also has the AI
 * Processing toggle (#122): on while AI consent is granted; turning it on asks (the consent
 * prompt: Allow grants, Not Now leaves it off), turning it off declines at once.
 */
export function usePremiumScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const premium = usePremium();
  const restore = useRestorePurchases();
  const storeName = t(getStoreNameKey(Platform.OS));
  // In a trial that converts, the plan's store price says what it becomes ("…, then Rp99,000/year").
  const status = premium.status;
  const isConvertingTrial = status.kind === 'store' && status.isTrial && status.willRenew;
  const offering = usePremiumOffering({ enabled: isConvertingTrial });
  const renewal = status.kind === 'store' && status.plan ? offering.data?.[status.plan] : null;
  const renewalPrice =
    isConvertingTrial && renewal
      ? t(getPlanPriceKey(renewal.plan), { price: renewal.pkg.product.priceString })
      : null;
  const labels = getPremiumStatusLabels(status, formatMediumDate, renewalPrice);
  const { session } = useSession();
  const aiConsent = useRequireAiConsent();

  function setAiProcessing(isOn: boolean) {
    if (getToggleAction(isOn) === 'ask') void aiConsent.ask('settings');
    else aiConsent.save('declined');
  }

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
    retry: () => void premium.refresh(),
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
    /** Accounts only: a guest has no AI features to consent to. */
    showsAiProcessing: !!session,
    isAiProcessingOn: isAiProcessingOn(aiConsent.consent),
    /** Until the stored answer loads, and while one saves. */
    isAiProcessingDisabled: !aiConsent.isKnown || aiConsent.isSaving,
    setAiProcessing,
    openPrivacy: () => openLegalPage('privacy'),
  };
}
