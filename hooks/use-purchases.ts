import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { useSession } from '@/hooks/use-auth';
import {
  getCustomerInfo,
  getPremiumOffering,
  getPurchasesIdentity,
  identifyPurchases,
  PURCHASES_TIMEOUT_MS,
  purchasePremium,
  restorePremium,
  subscribeCustomerInfo,
  subscribePurchasesIdentity,
} from '@/lib/purchases';
import { supabase } from '@/lib/supabase';

const CUSTOMER_INFO_KEY = 'customer-info';
const PREMIUM_OFFERING_KEY = 'premium-offering';

/**
 * Keeps RevenueCat on the signed-in account, mounted once (`AuthListener`): `logIn` with the
 * Supabase user id when a session appears, `logOut` when it goes. A guest has no session, so
 * RevenueCat never identifies them. Customer-info updates from the SDK (a renewal, an expiry, a
 * purchase made elsewhere) go straight into the cache.
 *
 * It follows Supabase's auth events directly, not `useSession()`: this hook lives for the whole
 * app, and after a sign-out or Erase Data (`queryClient.clear()`) a long-lived query observer
 * stays on the removed session query until its component re-renders, so it never saw the next
 * sign-in and Premium waited on an identity that never came (#79).
 */
export function usePurchasesIdentitySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Fires INITIAL_SESSION at once, then every sign-in, sign-out and token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Not awaited: Supabase holds its auth lock while this callback runs.
      void identifyPurchases(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(
    () =>
      subscribeCustomerInfo((info) => {
        const { purchasesUserId } = getPurchasesIdentity();
        if (purchasesUserId) queryClient.setQueryData([CUSTOMER_INFO_KEY, purchasesUserId], info);
      }),
    [queryClient],
  );
}

/** Try Again: identifies RevenueCat as the current session's account again (`logIn`). */
export async function resyncPurchasesIdentity(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await identifyPurchases(session?.user.id ?? null);
}

/**
 * The RevenueCat identity for the signed-in account: `purchasesUserId` once it's identified as
 * them, `isSettling` while the sync works on the current session, and `isFailed` when its logIn
 * failed or timed out (or the sync never answered for this session), so screens show an error
 * with Try Again (`retry`) instead of a spinner that never ends.
 */
export function usePurchasesIdentity(): {
  purchasesUserId: string | null;
  isSettling: boolean;
  isFailed: boolean;
  retry: () => Promise<void>;
} {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const state = useSyncExternalStore(subscribePurchasesIdentity, getPurchasesIdentity);
  const isCurrent = state.userId === userId;
  const isWaiting = !!userId && (!isCurrent || state.status === 'settling');
  // The SDK calls time out on their own; this covers a sync that never started for this session.
  const [timedOutFor, setTimedOutFor] = useState<string | null>(null);

  useEffect(() => {
    if (!isWaiting || !userId) return;
    const timer = setTimeout(() => setTimedOutFor(userId), PURCHASES_TIMEOUT_MS * 2);
    return () => clearTimeout(timer);
  }, [isWaiting, userId]);

  const hasTimedOut = isWaiting && timedOutFor === userId;
  return {
    purchasesUserId: isCurrent && state.purchasesUserId === userId ? userId : null,
    isSettling: isWaiting && !hasTimedOut,
    isFailed: hasTimedOut || (!!userId && isCurrent && state.status === 'failed'),
    retry: async () => {
      setTimedOutFor(null);
      await resyncPurchasesIdentity();
    },
  };
}

/** The signed-in account's RevenueCat customer info (entitlements, management URL). */
export function useCustomerInfo() {
  const { purchasesUserId } = usePurchasesIdentity();
  return useQuery({
    queryKey: [CUSTOMER_INFO_KEY, purchasesUserId],
    queryFn: getCustomerInfo,
    enabled: !!purchasesUserId,
    // Each try already waits up to PURCHASES_TIMEOUT_MS: one retry, then the error and Try Again.
    retry: 1,
  });
}

/**
 * The Premium plans from the `default` offering, with trial eligibility (`lib/purchases.ts`).
 * `enabled: false` skips loading them (the Premium screen only needs a price during a trial).
 */
export function usePremiumOffering({ enabled = true }: { enabled?: boolean } = {}) {
  const identity = usePurchasesIdentity();
  const { purchasesUserId } = identity;
  const query = useQuery({
    queryKey: [PREMIUM_OFFERING_KEY, purchasesUserId],
    queryFn: getPremiumOffering,
    enabled: enabled && !!purchasesUserId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return {
    ...query,
    isSettling: identity.isSettling,
    isIdentityFailed: identity.isFailed,
    purchasesUserId,
    retryIdentity: identity.retry,
  };
}

function useSetCustomerInfo() {
  const queryClient = useQueryClient();
  const { purchasesUserId } = usePurchasesIdentity();
  return (info: CustomerInfo) => {
    if (purchasesUserId) queryClient.setQueryData([CUSTOMER_INFO_KEY, purchasesUserId], info);
    // A trial once used isn't offered again.
    queryClient.invalidateQueries({ queryKey: [PREMIUM_OFFERING_KEY] });
  };
}

/** Buys a Premium package; resolves `cancelled` (no error) when the store sheet is dismissed. */
export function usePurchasePremium() {
  const setCustomerInfo = useSetCustomerInfo();
  return useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePremium(pkg),
    onSuccess: (outcome) => {
      if (outcome.kind === 'purchased') setCustomerInfo(outcome.info);
    },
  });
}

/** Restore Purchases: re-reads the store account's purchases into RevenueCat. */
export function useRestorePurchases() {
  const setCustomerInfo = useSetCustomerInfo();
  return useMutation({
    mutationFn: restorePremium,
    onSuccess: setCustomerInfo,
  });
}
