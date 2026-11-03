import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

/** The name Apple shares, only on the first sign-in with this app. */
export type AppleName = { fullName: string; givenName: string | null; familyName: string | null };

export type AppleCredential = {
  identityToken: string;
  /** The unhashed nonce, for Supabase to check against the token's hashed `nonce` claim. */
  rawNonce: string;
  name: AppleName | null;
};

/** Whether this device offers Sign in with Apple. The `.android` sibling always says no. */
export function isAppleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Presents the system Sign in with Apple sheet. Apple gets the SHA-256 of a fresh random nonce;
 * the raw nonce comes back for Supabase. Resolves `'cancelled'` when the user dismisses the sheet.
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
    if ((error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') return 'cancelled';
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
    name: fullName
      ? {
          fullName,
          givenName: credential.fullName?.givenName ?? null,
          familyName: credential.fullName?.familyName ?? null,
        }
      : null,
  };
}
