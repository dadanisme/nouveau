import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { getErrorCode } from '@/utils/error';

/**
 * Errors that mean the user dismissed the system UI, not a failure: Cancel on the sheet, and
 * Close on iOS's own "Sign in to your Apple Account" alert (no Apple Account on the device), which
 * ASAuthorization reports as `unknown`. iOS already explained the latter, so neither alerts.
 */
const DISMISSED_CODES = new Set(['ERR_REQUEST_CANCELED', 'ERR_REQUEST_UNKNOWN']);

/** The name Apple shares, only on the first sign-in with this app. */
export type AppleName = { fullName: string; givenName: string | null; familyName: string | null };

export type AppleCredential = {
  identityToken: string;
  /** The unhashed nonce, for Supabase to check against the token's hashed `nonce` claim. */
  rawNonce: string;
  name: AppleName | null;
  /** Apple's stable user ID (the identity token's `sub`), to check which account signed in. */
  user: string;
  /**
   * The short-lived code the server exchanges for a refresh token, so it can revoke the app's
   * tokens when the account is deleted. Sign-in ignores it.
   */
  authorizationCode: string | null;
};

/** Whether this device offers Sign in with Apple. The `.android` sibling always says no. */
export function isAppleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Presents the system Sign in with Apple sheet. Apple gets the SHA-256 of a fresh random nonce;
 * the raw nonce comes back for Supabase. Resolves `'cancelled'` when the user dismisses it.
 */
export async function requestAppleCredential(): Promise<AppleCredential | 'cancelled'> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (DISMISSED_CODES.has(getErrorCode(error) ?? '')) return 'cancelled';
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('No identity token received from Sign in with Apple');
  }

  const fullName = credential.fullName
    ? AppleAuthentication.formatFullName(credential.fullName).trim()
    : '';

  return {
    identityToken: credential.identityToken,
    rawNonce,
    user: credential.user,
    authorizationCode: credential.authorizationCode,
    name: fullName
      ? {
          fullName,
          givenName: credential.fullName?.givenName ?? null,
          familyName: credential.fullName?.familyName ?? null,
        }
      : null,
  };
}
