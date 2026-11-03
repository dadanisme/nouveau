import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
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

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });
      if (error) throw error;
      return 'signedIn';
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
