import 'expo-sqlite/localStorage/install';
import { randomUUID } from 'expo-crypto';
import { getLocales } from 'expo-localization';

import { GUEST_USER_ID_KEY, WORKSPACE_STORAGE_KEY } from '@/constants/storage-keys';
import { eraseLocalData, getLocalDb } from '@/lib/local-db';

/** The guest's id (their rows' `user_id` / `owner_id`), or null when there is no guest. */
export function readGuestId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(GUEST_USER_ID_KEY);
}

/** The device region's currency, the onboarding currency step's suggestion; IDR when it has none. */
export function deviceCurrency(): string {
  return getLocales()[0]?.currencyCode ?? 'IDR';
}

/**
 * Starts using the app without an account: a guest id, a Personal workspace in `homeCurrency`
 * (chosen on the onboarding currency step, #78) with the default categories (seeded once, in one
 * exclusive transaction), and that workspace as the active one. Safe to retry: the seed is
 * idempotent and keeps the first guest. The guest id is stored only once the seed has committed,
 * so an interrupted start leaves no guest without a workspace. Resolves the guest id.
 */
export async function startGuest(homeCurrency: string): Promise<string> {
  const db = await getLocalDb();
  const { guestId, workspaceId } = await db.seedGuestWorkspace({
    guestId: readGuestId() ?? randomUUID(),
    homeCurrency,
  });
  localStorage.setItem(GUEST_USER_ID_KEY, guestId);
  localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  return guestId;
}

/** Ends the guest: deletes their on-device data, then the guest id. */
export async function endGuest(): Promise<void> {
  await eraseLocalData();
  localStorage.removeItem(GUEST_USER_ID_KEY);
}
