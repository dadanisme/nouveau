import 'expo-sqlite/localStorage/install';

import { ONBOARDING_SEEN_KEY } from '@/constants/storage-keys';

/**
 * Whether the first-run value pages were seen (#78). Read synchronously, like `readGuestId`, so
 * `AuthGuard` routes a cold launch on its first pass, before the splash hides.
 */
export function readOnboardingSeen(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
}

/** Records that the value pages were seen, so signing out later opens on Welcome. */
export function markOnboardingSeen(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(ONBOARDING_SEEN_KEY) !== 'true') {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
  }
}
