/** `localStorage` (expo-sqlite) keys shared across modules. */

/** The active workspace's id. */
export const WORKSPACE_STORAGE_KEY = 'active_workspace_id';

/** Set while someone uses the app without an account (#100): the guest's id. */
export const GUEST_USER_ID_KEY = 'guest_user_id';

/**
 * Set once the first-run value pages have been seen (#78), or once someone signed in or started
 * as a guest, so a later sign-out opens on Welcome instead of the value pages.
 */
export const ONBOARDING_SEEN_KEY = 'onboarding_seen';
