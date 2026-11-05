import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export type GoogleCredential = {
  idToken: string;
  /** Google's stable user ID (the ID token's `sub`), to check which account signed in. */
  userId: string;
  email: string;
};

/**
 * Presents the native Google account picker (configured in `lib/supabase.ts`). Resolves
 * `'cancelled'` when the user dismisses it.
 */
export async function requestGoogleCredential(): Promise<GoogleCredential | 'cancelled'> {
  await GoogleSignin.hasPlayServices();

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    // Older native paths reject on cancel instead of resolving a cancelled response.
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'cancelled';
    }
    throw error;
  }
  if (isCancelledResponse(response)) return 'cancelled';

  if (!response.data.idToken) {
    throw new Error('No ID token received from Google Sign-In');
  }

  return {
    idToken: response.data.idToken,
    userId: response.data.user.id,
    email: response.data.user.email,
  };
}
