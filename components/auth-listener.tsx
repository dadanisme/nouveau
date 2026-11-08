import { useAuthListener } from '@/hooks/use-auth-listener';
import { usePurchasesIdentitySync } from '@/hooks/use-purchases';

/** Keeps the session in the cache, and RevenueCat on the signed-in account (#79). */
export function AuthListener({ children }: { children: React.ReactNode }) {
  useAuthListener();
  usePurchasesIdentitySync();
  return children;
}
