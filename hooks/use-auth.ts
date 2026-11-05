import type { User } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { isAppleSignInAvailable, requestAppleCredential, type AppleName } from '@/lib/apple-auth';
import {
  signInWithAppleCredential,
  signInWithEmailPassword,
  signInWithGoogleCredential,
  signOutLocally,
} from '@/lib/auth';
import { requestGoogleCredential } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { isPlaceholderDisplayName } from '@/utils/string';

export function useSession() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    staleTime: Infinity,
  });

  return { session: session ?? null, isLoading };
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useSignInWithEmail() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await signInWithEmailPassword(email, password);
    },
  });
}

export function useSignUpWithEmail() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
  });
}

/**
 * How a provider sign-in (Google, Apple) ended. Dismissing the provider's sheet resolves
 * `'cancelled'` instead of failing, so callers show no error for it.
 */
export type ProviderSignInResult = 'signedIn' | 'cancelled';

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async (): Promise<ProviderSignInResult> => {
      const credential = await requestGoogleCredential();
      if (credential === 'cancelled') return 'cancelled';
      await signInWithGoogleCredential(credential);
      return 'signedIn';
    },
  });
}

/** Whether to offer Sign in with Apple: iOS devices that support it (never Android). */
export function useAppleSignInAvailable() {
  const { data } = useQuery({
    queryKey: ['apple-sign-in-available'],
    queryFn: isAppleSignInAvailable,
    staleTime: Infinity,
  });
  return data ?? false;
}

/**
 * Stores the name Apple shares on the first sign-in (it never sends it again), the way names
 * arrive from Google: `full_name` in the auth user metadata, and `users.display_name`. Neither
 * overwrites a real name already there. Best effort: a failure here doesn't fail the sign-in.
 */
async function saveAppleName(user: User, name: AppleName) {
  try {
    if (!user.user_metadata?.full_name) {
      await supabase.auth.updateUser({
        data: {
          full_name: name.fullName,
          given_name: name.givenName,
          family_name: name.familyName,
        },
      });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle();
    if (profile && isPlaceholderDisplayName(profile.display_name, profile.email ?? user.email)) {
      await supabase.from('users').update({ display_name: name.fullName }).eq('id', user.id);
    }
  } catch (error) {
    console.warn('Could not save the name from Sign in with Apple', error);
  }
}

export function useSignInWithApple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ProviderSignInResult> => {
      const credential = await requestAppleCredential();
      if (credential === 'cancelled') return 'cancelled';

      const user = await signInWithAppleCredential(credential);

      if (credential.name && user) {
        await saveAppleName(user, credential.name);
        queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      }
      return 'signedIn';
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutLocally,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
