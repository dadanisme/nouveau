import 'expo-sqlite/localStorage/install';

import { PREMIUM_PAYWALL_PENDING_KEY, PREMIUM_PAYWALL_SHOWN_KEY } from '@/constants/storage-keys';

/**
 * The onboarding paywall's flags (#79), in `localStorage` like `lib/onboarding.ts`: which account
 * it's queued for (set by a brand-new account's currency step) and which accounts have seen it.
 */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`: re-read the flags when they change. */
export function subscribeOnboardingPaywall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readOnboardingPaywallPending(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(PREMIUM_PAYWALL_PENDING_KEY);
}

/** The ids the paywall was shown to; a stable string, so `useSyncExternalStore` can compare it. */
export function readOnboardingPaywallShown(): string {
  if (typeof localStorage === 'undefined') return '[]';
  return localStorage.getItem(PREMIUM_PAYWALL_SHOWN_KEY) ?? '[]';
}

export function parseShownIds(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Queues the paywall for a brand-new account, unless it has already seen it. */
export function queueOnboardingPaywall(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  if (parseShownIds(readOnboardingPaywallShown()).includes(userId)) return;
  localStorage.setItem(PREMIUM_PAYWALL_PENDING_KEY, userId);
  notify();
}

/** Drops the queued paywall; `shown` also records the account so it never comes back. */
export function finishOnboardingPaywall(userId: string, { shown }: { shown: boolean }): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PREMIUM_PAYWALL_PENDING_KEY);
  if (shown) {
    const ids = parseShownIds(readOnboardingPaywallShown());
    if (!ids.includes(userId)) {
      localStorage.setItem(PREMIUM_PAYWALL_SHOWN_KEY, JSON.stringify([...ids, userId]));
    }
  }
  notify();
}
