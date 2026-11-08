import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { useSession } from '@/hooks/use-auth';
import {
  getCustomerInfo,
  getPremiumOffering,
  identifyPurchases,
  purchasePremium,
  restorePremium,
  subscribeCustomerInfo,
} from '@/lib/purchases';

/**
 * RevenueCat's identity for this session (#79): the Supabase user it was asked to identify as
 * (`userId`), and the one it is identified as (`purchasesUserId`, null when unavailable or the
 * identify failed). Until `userId` matches the session's, the identity is still settling.
 */
interface PurchasesIdentity {
  userId: string | null;
  purchasesUserId: string | null;
}

export const PURCHASES_IDENTITY_KEY = ['purchases-identity'];
const CUSTOMER_INFO_KEY = 'customer-info';
const PREMIUM_OFFERING_KEY = 'premium-offering';

/**
 * Keeps RevenueCat on the signed-in account, mounted once (`AuthListener`): `logIn` with the
 * Supabase user id when a session appears, `logOut` when it goes. A guest has no session, so
 * RevenueCat never identifies them. Customer-info updates from the SDK (a renewal, an expiry, a
 * purchase made elsewhere) go straight into the cache.
 */
export function usePurchasesIdentitySync() {
  const queryClient = useQueryClient();
  const { session, isLoading } = useSession();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    identifyPurchases(userId).then((purchasesUserId) => {
      if (cancelled) return;
      queryClient.setQueryData<PurchasesIdentity>(PURCHASES_IDENTITY_KEY, {
        userId,
        purchasesUserId,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isLoading, queryClient]);

  useEffect(
    () =>
      subscribeCustomerInfo((info) => {
        const identity = queryClient.getQueryData<PurchasesIdentity>(PURCHASES_IDENTITY_KEY);
        if (identity?.purchasesUserId) {
          queryClient.setQueryData([CUSTOMER_INFO_KEY, identity.purchasesUserId], info);
        }
      }),
    [queryClient],
  );
}

/**
 * The RevenueCat identity for the signed-in account: `purchasesUserId` once it's identified as
 * them, and `isSettling` until the sync has answered for the current session.
 */
export function usePurchasesIdentity(): { purchasesUserId: string | null; isSettling: boolean } {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const { data } = useQuery<PurchasesIdentity | null>({
    queryKey: PURCHASES_IDENTITY_KEY,
    // Only `usePurchasesIdentitySync` writes it (never fetched, so a fetch can't overwrite its
    // answer); a cleared cache waits for the next one.
    queryFn: () => null,
    initialData: null,
    staleTime: Infinity,
  });
  const isCurrent = !!data && data.userId === userId;
  return {
    purchasesUserId: isCurrent && data.purchasesUserId === userId ? userId : null,
    isSettling: !!userId && !isCurrent,
  };
}

/** The signed-in account's RevenueCat customer info (entitlements, management URL). */
export function useCustomerInfo() {
  const { purchasesUserId } = usePurchasesIdentity();
  return useQuery({
    queryKey: [CUSTOMER_INFO_KEY, purchasesUserId],
    queryFn: getCustomerInfo,
    enabled: !!purchasesUserId,
  });
}

/** The Premium plans from the `default` offering, with trial eligibility (`lib/purchases.ts`). */
export function usePremiumOffering() {
  const { purchasesUserId, isSettling } = usePurchasesIdentity();
  const query = useQuery({
    queryKey: [PREMIUM_OFFERING_KEY, purchasesUserId],
    queryFn: getPremiumOffering,
    enabled: !!purchasesUserId,
    staleTime: 5 * 60 * 1000,
  });
  return { ...query, isSettling, purchasesUserId };
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
