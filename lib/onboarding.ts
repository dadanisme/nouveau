import 'expo-sqlite/localStorage/install';

import { ONBOARDING_SEEN_KEY } from '@/constants/storage-keys';

/**
 * Whether the first-run value pages were seen (#78). Read synchronously, like `readGuestId`, so
 * the root Stack's guards send a cold launch to the right onboarding screen on the first render.
 */
export function readOnboardingSeen(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
}

const listeners = new Set<() => void>();

/**
 * Subscribes to `markOnboardingSeen`, for `useSyncExternalStore`: the root Stack's signed-out
 * redirect reads the flag during render, so it must re-render when the flag is set.
 */
export function subscribeOnboardingSeen(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Records that the value pages were seen, so signing out later opens on Welcome. */
export function markOnboardingSeen(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(ONBOARDING_SEEN_KEY) !== 'true') {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    listeners.forEach((listener) => listener());
  }
}
