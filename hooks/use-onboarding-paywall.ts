import { router } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';

import { useSession } from '@/hooks/use-auth';
import { usePremium } from '@/hooks/use-premium';
import {
  finishOnboardingPaywall,
  parseShownIds,
  readOnboardingPaywallPending,
  readOnboardingPaywallShown,
  subscribeOnboardingPaywall,
} from '@/lib/premium-onboarding';
import { shouldPresentOnboardingPaywall } from '@/utils/premium';

/** Long enough for the currency step's fade to the tabs (300 ms) to finish first. */
const PRESENT_DELAY_MS = 400;

/**
 * Presents the paywall once to a brand-new account (#79), mounted in the root layout: the currency
 * step (`?for=account`) queues it when saved (`queueOnboardingPaywall`), and once that account is
 * on the tabs with the handover over (`isSettled`), it opens `(sheets)/paywall?source=onboarding`
 * and records that it was shown, so it never repeats. Guests and returning sign-ins never reach
 * the currency step's account mode, so it's never queued for them. An account that already has
 * Premium (a comp), or a build that can't sell it, drops it without showing anything.
 */
export function useOnboardingPaywall(isSettled: boolean) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const pendingFor = useSyncExternalStore(subscribeOnboardingPaywall, readOnboardingPaywallPending);
  const shown = useSyncExternalStore(subscribeOnboardingPaywall, readOnboardingPaywallShown);
  const premium = usePremium();
  const isQueuedHere = !!userId && pendingFor === userId;
  const isPointless = !premium.isLoading && (premium.isActive || !premium.isAvailable);

  useEffect(() => {
    if (isQueuedHere && isPointless) finishOnboardingPaywall(userId, { shown: false });
  }, [isQueuedHere, isPointless, userId]);

  const shouldPresent = shouldPresentOnboardingPaywall({
    pendingFor,
    userId,
    shownTo: parseShownIds(shown),
    isSettled,
    isAvailable: premium.isAvailable,
    // An unknown status (it failed to load) waits too: the account may already have Premium.
    isStatusLoading: premium.isLoading || premium.hasError,
    isPremium: premium.isActive,
  });

  useEffect(() => {
    if (!shouldPresent || !userId) return;
    const timeout = setTimeout(() => {
      finishOnboardingPaywall(userId, { shown: true });
      router.push({ pathname: '/paywall', params: { source: 'onboarding' } });
    }, PRESENT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [shouldPresent, userId]);
}
