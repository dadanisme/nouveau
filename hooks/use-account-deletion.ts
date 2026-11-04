import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { useSession } from '@/hooks/use-auth';
import { API_BASE_URL, authenticatedFetch } from '@/lib/api';
import { requestAppleCredential } from '@/lib/apple-auth';
import {
  signInWithAppleCredential,
  signInWithEmailPassword,
  signInWithGoogleCredential,
  signOutLocally,
} from '@/lib/auth';
import { requestGoogleCredential } from '@/lib/google-auth';
import { resetTo } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import {
  AccountMismatchError,
  isLinkedAccount,
  resolveReauthProvider,
  unwrapPreview,
  type DeletionPreview,
  type ReauthProvider,
} from '@/utils/account-deletion';

const PREVIEW_URL = `${API_BASE_URL}/api/account/deletion-preview`;
const ACCOUNT_URL = `${API_BASE_URL}/api/account`;

/** The methods the current session signed in with (its JWT `amr` claim, read locally). */
async function getSessionMethods(): Promise<string[]> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return [];
  return data.currentAuthenticationMethods.map((entry) =>
    typeof entry === 'string' ? entry : entry.method,
  );
}

/**
 * What deleting the account would delete and hand over, and how this device re-authenticates
 * (`reauthProvider`, already resolved for the platform: see `resolveReauthProvider`).
 */
export function useDeletionPreview() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['account-deletion-preview', userId],
    queryFn: async (): Promise<DeletionPreview> => {
      const body = await authenticatedFetch<
        DeletionPreview | { success: boolean; data: DeletionPreview }
      >(PREVIEW_URL);
      const preview = unwrapPreview(body);
      const needsSessionMethods = preview.reauthProvider === 'apple' && Platform.OS !== 'ios';
      return {
        ...preview,
        reauthProvider: resolveReauthProvider(
          preview.reauthProvider,
          Platform.OS,
          needsSessionMethods ? await getSessionMethods() : [],
        ),
      };
    },
    enabled: !!userId,
  });
}

type Reauthentication = { appleAuthorizationCode?: string } | 'cancelled';

/**
 * Signs in again as the current user, so the server sees a fresh sign-in: the password for
 * `email`, the native Google or Apple sheet otherwise. A dismissed sheet resolves `'cancelled'`.
 * A provider account other than the linked one fails with `AccountMismatchError` before it signs
 * in. Apple's authorization code comes back for the server to revoke the app's Apple tokens.
 */
async function reauthenticate(
  provider: ReauthProvider,
  password: string,
): Promise<Reauthentication> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');

  switch (provider) {
    case 'email': {
      if (!user.email) throw new Error('This account has no email address');
      await signInWithEmailPassword(user.email, password);
      return {};
    }
    case 'google': {
      const credential = await requestGoogleCredential();
      if (credential === 'cancelled') return 'cancelled';
      if (!isLinkedAccount(user, 'google', credential.userId, credential.email)) {
        throw new AccountMismatchError();
      }
      const signedIn = await signInWithGoogleCredential(credential);
      if (signedIn.id !== user.id) throw new AccountMismatchError();
      return {};
    }
    case 'apple': {
      const credential = await requestAppleCredential();
      if (credential === 'cancelled') return 'cancelled';
      if (!isLinkedAccount(user, 'apple', credential.user)) throw new AccountMismatchError();
      const signedIn = await signInWithAppleCredential(credential);
      if (signedIn.id !== user.id) throw new AccountMismatchError();
      return { appleAuthorizationCode: credential.authorizationCode ?? undefined };
    }
  }
}

export type DeleteAccountResult = 'deleted' | 'cancelled';

/**
 * Deletes the account: re-authenticates (`reauthenticate`), calls `DELETE /api/account` (with the
 * Apple code when there is one), then signs out on this device, clears the cache and returns to
 * Login. `onDeleted` runs after that, even though the screen that started it has gone.
 */
export function useDeleteAccount({ onDeleted }: { onDeleted?: () => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      password,
    }: {
      provider: ReauthProvider;
      password: string;
    }): Promise<DeleteAccountResult> => {
      const reauth = await reauthenticate(provider, password);
      if (reauth === 'cancelled') return 'cancelled';

      await authenticatedFetch<void>(ACCOUNT_URL, {
        method: 'DELETE',
        body: JSON.stringify(
          reauth.appleAuthorizationCode
            ? { appleAuthorizationCode: reauth.appleAuthorizationCode }
            : {},
        ),
      });

      try {
        await signOutLocally();
      } catch (error) {
        // The account is gone either way; the auth server may already reject its session.
        console.warn('Sign-out after account deletion failed', error);
      }
      return 'deleted';
    },
    onSuccess: (result) => {
      if (result !== 'deleted') return;
      queryClient.clear();
      resetTo('/login');
      onDeleted?.();
    },
  });
}
