import type { User } from '@supabase/supabase-js';

import type { AppleCredential } from '@/lib/apple-auth';
import type { GoogleCredential } from '@/lib/google-auth';
import i18n from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { k } from '@/locales/keys';
import { withTimeout } from '@/utils/promise';

// A sign-in that hasn't answered by then fails with an alert instead of spinning forever.
const SIGN_IN_TIMEOUT_MS = 30_000;

/**
 * Supabase sign-ins shared by the sign-in screens and by re-authentication before an account
 * deletion. Each resolves the signed-in user or throws the Supabase error.
 */

export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    SIGN_IN_TIMEOUT_MS,
    i18n.t(k.common.requestTimedOut),
  );
  if (error) throw error;
  return data.user;
}

export async function signInWithGoogleCredential(credential: GoogleCredential): Promise<User> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential.idToken,
  });
  if (error) throw error;
  return data.user;
}

export async function signInWithAppleCredential(credential: AppleCredential): Promise<User> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: credential.rawNonce,
  });
  if (error) throw error;
  return data.user;
}

/** Signs out on this device only: other devices signed in to the account stay signed in. */
export async function signOutLocally() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
