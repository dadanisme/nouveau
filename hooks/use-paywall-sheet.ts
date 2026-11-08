import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { LEGAL_URLS } from '@/constants/legal';
import { useLanguage } from '@/contexts/language';
import { useIsGuest, useSession } from '@/hooks/use-auth';
import { usePremiumOffering, usePurchasePremium, useRestorePurchases } from '@/hooks/use-purchases';
import { useSheetResponder } from '@/hooks/use-sheet-result';
import { showAlertDialog } from '@/lib/alert-dialog';
import { goBackOrHome } from '@/lib/navigation';
import { isPurchasesAvailable, toEntitlementSnapshot, type PremiumPackage } from '@/lib/purchases';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';
import {
  getDisclosureKey,
  getPlanPriceKey,
  getPlanTitleKey,
  getPrimaryActionKey,
  getStoreNameKey,
  getTrialDurationLabel,
  getYearlySavingsPercent,
  parsePaywallSource,
  PREMIUM_BENEFITS,
  type LabelKey,
  type PremiumPlan,
} from '@/utils/premium';

/** After a pending purchase closes the paywall, so its alert doesn't land on the closing sheet. */
const PENDING_NOTICE_DELAY_MS = 600;

export interface PaywallSheetParams {
  /** `onboarding` | `feature` | `settings`; anything else reads as `settings`. */
  source: string;
  /** The `PremiumFeature` that opened it, from a held tap. */
  feature?: string;
  /** From `useRequirePremium`: the presenter runs the held action once Premium is bought. */
  requestId?: string;
}

/** A plan row: its name, price per period, and the yearly plan's saving. */
export interface PaywallPlanRow {
  plan: PremiumPlan;
  title: string;
  subtitle: string;
  /** "Save 17%", on the yearly plan when it saves anything. */
  badge?: string;
  selected: boolean;
}

/** What the plans section shows: a spinner, a notice (with Try Again when it can help), or plans. */
export type PaywallState = 'loading' | 'unavailable' | 'error' | 'ready';

/**
 * Screen hook for the paywall sheet (`(sheets)/paywall`, #79): the benefits, both plans with
 * their store prices (yearly preselected, with its saving), the free trial when the store says
 * this account can have it, the renewal disclosure, Subscribe / Start Free Trial, Restore
 * Purchases, and the Terms and Privacy links. Buying or restoring Premium closes the sheet and
 * tells the presenter, which runs the held feature; a cancelled store sheet leaves it open with
 * nothing said; a pending (deferred) payment closes it and says Premium turns on once it's paid.
 * From onboarding it also has Not Now, which just closes it.
 *
 * It only buys, restores or reloads plans while RevenueCat's app user id is the signed-in
 * account's, so a purchase can never land on an anonymous or another account's RevenueCat user.
 * A guest who reaches it (e.g. a `nouveau://paywall` link) gets the sign-in prompt in its place.
 */
export function usePaywallSheet() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<Partial<PaywallSheetParams>>();
  const source = parsePaywallSource(params.source);
  const { session } = useSession();
  const isGuest = useIsGuest();
  const offering = usePremiumOffering();
  const userId = session?.user.id ?? null;
  /** RevenueCat is identified as the signed-in account: only then can it buy or restore. */
  const isIdentified = !!userId && offering.purchasesUserId === userId;
  const purchase = usePurchasePremium();
  const restore = useRestorePurchases();
  const respond = useSheetResponder('paywall');
  const [chosenPlan, setChosenPlan] = useState<PremiumPlan>('yearly');
  const storeName = t(getStoreNameKey(Platform.OS));

  // Buying Premium needs an account: a guest gets the sign-in prompt instead (it closes itself,
  // and its Sign In pushes Login).
  useEffect(() => {
    if (isGuest) router.replace({ pathname: '/sign-in-prompt', params: { feature: 'premium' } });
  }, [isGuest, router]);

  const label = (value: LabelKey | null) => (value ? t(value.key, value.params) : '');

  const packages = [offering.data?.yearly, offering.data?.monthly].filter(
    (pkg): pkg is PremiumPackage => !!pkg,
  );
  const selected = packages.find((pkg) => pkg.plan === chosenPlan) ?? packages[0] ?? null;
  const savings = getYearlySavingsPercent(
    offering.data?.monthly?.pkg.product.price,
    offering.data?.yearly?.pkg.product.price,
  );

  const planRows: PaywallPlanRow[] = packages.map(({ plan, pkg }) => {
    const { priceString, pricePerMonthString } = pkg.product;
    return {
      plan,
      title: t(getPlanTitleKey(plan)),
      subtitle:
        plan === 'yearly' && pricePerMonthString
          ? t(k.premium.yearlyEquivalent, { price: priceString, monthly: pricePerMonthString })
          : t(getPlanPriceKey(plan), { price: priceString }),
      badge: plan === 'yearly' && savings ? t(k.premium.save, { percent: savings }) : undefined,
      selected: pkg === selected?.pkg,
    };
  });

  const isTrialEligible = !!selected?.isTrialEligible;
  const duration = isTrialEligible ? label(getTrialDurationLabel(selected?.trialPeriod)) : '';
  const price = selected
    ? t(getPlanPriceKey(selected.plan), { price: selected.pkg.product.priceString })
    : '';

  const state: PaywallState = !isPurchasesAvailable()
    ? 'unavailable'
    : // A guest sees a spinner for the moment before the sign-in prompt replaces the sheet.
      isGuest || offering.isSettling || offering.isLoading
      ? 'loading'
      : selected
        ? 'ready'
        : 'error';

  const isBusy = purchase.isPending || restore.isPending;
  const canSubscribe = isIdentified && state === 'ready' && !isBusy;
  const canRestore = isIdentified && state !== 'unavailable' && state !== 'loading' && !isBusy;

  function subscribe() {
    if (!selected || !canSubscribe) return;
    purchase.mutate(selected.pkg, {
      onSuccess: (outcome) => {
        // Cancelled in the store sheet: stay, with nothing to say.
        if (outcome.kind === 'purchased') respond({ purchased: true });
        // A deferred payment (e.g. paid later at a store): not a failure. Premium turns on through
        // a customer-info update once it completes, so the paywall closes and says so.
        if (outcome.kind === 'pending') {
          respond({ purchased: false });
          setTimeout(
            () => showAlertDialog(t(k.premium.paymentPending), t(k.premium.paymentPendingMessage)),
            PENDING_NOTICE_DELAY_MS,
          );
        }
      },
      onError: (error) =>
        showAlertDialog(
          t(k.premium.purchaseFailed),
          getErrorMessage(error, t(k.common.unexpectedError)),
        ),
    });
  }

  function restorePurchases() {
    if (!canRestore) return;
    restore.mutate(undefined, {
      onSuccess: (info) => {
        if (toEntitlementSnapshot(info)?.isActive) {
          respond({ purchased: true });
          return;
        }
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
    title: t(k.premium.title),
    tagline: t(k.premium.tagline),
    benefits: PREMIUM_BENEFITS.map((benefit) => ({
      title: t(benefit.titleKey),
      body: t(benefit.bodyKey),
      symbol: benefit.symbol,
    })),
    state,
    notice: state === 'unavailable' ? t(k.premium.unavailable) : t(k.premium.loadFailed),
    canRetry: isIdentified,
    retry: () => {
      if (isIdentified) void offering.refetch();
    },
    plansTitle: t(k.premium.plansSection),
    planRows,
    selectPlan: setChosenPlan,
    trialFooter: duration ? t(k.premium.trialFooter, { duration, price }) : undefined,
    primaryLabel: t(getPrimaryActionKey(isTrialEligible)),
    isPurchasing: purchase.isPending,
    canSubscribe,
    subscribe,
    restoreLabel: restore.isPending ? t(k.premium.restoring) : t(k.premium.restore),
    isRestoring: restore.isPending,
    canRestore,
    restorePurchases,
    disclosure: selected
      ? t(getDisclosureKey(isTrialEligible), { duration, price, store: storeName })
      : undefined,
    termsLabel: t(k.premium.terms),
    privacyLabel: t(k.premium.privacy),
    openTerms: () => void WebBrowser.openBrowserAsync(LEGAL_URLS.terms),
    openPrivacy: () => void WebBrowser.openBrowserAsync(LEGAL_URLS.privacy),
    /** Onboarding's Not Now: a clear way on to the app. */
    notNowLabel: source === 'onboarding' ? t(k.premium.notNow) : undefined,
    close: () => goBackOrHome(),
  };
}
