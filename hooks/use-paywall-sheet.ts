import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform } from 'react-native';

import { LEGAL_URLS } from '@/constants/legal';
import { useLanguage } from '@/contexts/language';
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
 * nothing said. From onboarding it also has Not Now, which just closes it.
 */
export function usePaywallSheet() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<Partial<PaywallSheetParams>>();
  const source = parsePaywallSource(params.source);
  const offering = usePremiumOffering();
  const purchase = usePurchasePremium();
  const restore = useRestorePurchases();
  const respond = useSheetResponder('paywall');
  const [chosenPlan, setChosenPlan] = useState<PremiumPlan>('yearly');
  const storeName = t(getStoreNameKey(Platform.OS));

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
    : offering.isSettling || offering.isLoading
      ? 'loading'
      : selected
        ? 'ready'
        : 'error';

  const isBusy = purchase.isPending || restore.isPending;

  function subscribe() {
    if (!selected || isBusy) return;
    purchase.mutate(selected.pkg, {
      onSuccess: (outcome) => {
        // Cancelled in the store sheet: stay, with nothing to say.
        if (outcome.kind === 'purchased') respond({ purchased: true });
      },
      onError: (error) =>
        showAlertDialog(
          t(k.premium.purchaseFailed),
          getErrorMessage(error, t(k.common.unexpectedError)),
        ),
    });
  }

  function restorePurchases() {
    if (isBusy) return;
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
    retry: () => void offering.refetch(),
    plansTitle: t(k.premium.plansSection),
    planRows,
    selectPlan: setChosenPlan,
    trialFooter: duration ? t(k.premium.trialFooter, { duration, price }) : undefined,
    primaryLabel: t(getPrimaryActionKey(isTrialEligible)),
    isPurchasing: purchase.isPending,
    canSubscribe: state === 'ready' && !isBusy,
    subscribe,
    restoreLabel: restore.isPending ? t(k.premium.restoring) : t(k.premium.restore),
    isRestoring: restore.isPending,
    canRestore: state !== 'unavailable' && state !== 'loading' && !isBusy,
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
