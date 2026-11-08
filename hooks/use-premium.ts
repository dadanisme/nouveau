import { useSession } from '@/hooks/use-auth';
import { useCustomerInfo, usePurchasesIdentity } from '@/hooks/use-purchases';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { isPurchasesAvailable, toEntitlementSnapshot } from '@/lib/purchases';
import { getPremiumStatus, isPremiumActive, type PremiumStatus } from '@/utils/premium';

export interface Premium {
  status: PremiumStatus;
  /** RevenueCat's `premium` entitlement is active, or an admin grant is. */
  isActive: boolean;
  /** Still finding out (session, grants, RevenueCat identity or customer info). */
  isLoading: boolean;
  /** This build can sell Premium (a RevenueCat key is set and the SDK started). */
  isAvailable: boolean;
  /** In the store's free trial. */
  isTrial: boolean;
  /** Comes from an admin grant, with no store subscription. */
  isGranted: boolean;
  /** When the store subscription renews (`willRenew`) or expires; null otherwise. */
  renewsAt: string | null;
  expiresAt: string | null;
  /** Reading the status failed (grants or customer info), with nothing to show. */
  hasError: boolean;
  refresh: () => Promise<void>;
}

/**
 * Whether the signed-in account has Nouveau Premium (#79): RevenueCat's `premium` entitlement or
 * an active admin grant in `feature_subscriptions` (comps, e.g. the App Review demo account).
 * Without a session (a guest) it's never active.
 */
export function usePremium(): Premium {
  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;
  const isAvailable = isPurchasesAvailable();
  const identity = usePurchasesIdentity();
  const customerInfo = useCustomerInfo();
  const grants = useSubscriptions(userId);

  const status = getPremiumStatus(toEntitlementSnapshot(customerInfo.data), grants.data);
  const isActive = !!userId && isPremiumActive(status);
  const isStoreLoading =
    isAvailable && (identity.isSettling || (!!identity.purchasesUserId && customerInfo.isLoading));
  const isLoading =
    isSessionLoading || (!!userId && !isActive && (grants.isLoading || isStoreLoading));

  const store = status.kind === 'store' ? status : null;

  return {
    status,
    isActive,
    isLoading,
    isAvailable,
    isTrial: !!store?.isTrial,
    isGranted: status.kind === 'granted',
    renewsAt: store?.willRenew ? store.expiresAt : null,
    expiresAt: store && !store.willRenew ? store.expiresAt : null,
    hasError: !isActive && (grants.isError || customerInfo.isError),
    refresh: async () => {
      await Promise.all([
        grants.refetch(),
        identity.purchasesUserId ? customerInfo.refetch() : null,
      ]);
    },
  };
}
