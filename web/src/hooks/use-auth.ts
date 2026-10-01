import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { pendingDeletes } from '@/lib/pending-deletes';
import { supabase } from '@/lib/supabase';
import { en } from '@/locales/en';

export const SESSION_QUERY_KEY = ['auth-session'] as const;

/**
 * Shared by `useSession()` and the route guards (via `queryClient.ensureQueryData`).
 * `getSession()` waits for the client to finish initialising, which includes consuming an
 * OAuth / email-confirmation redirect from the URL.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },
  staleTime: Infinity,
});

export function useSession() {
  const { data: session, isLoading } = useQuery(sessionQueryOptions);

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
    /** Resolves to `true` when the account still needs email confirmation. */
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      // With email confirmation on, Supabase answers a duplicate sign-up with an obfuscated
      // user that has no identities instead of an error.
      if (data.user && data.user.identities?.length === 0) {
        throw new Error(en.signup.alreadyRegistered);
      }
      return { needsEmailConfirmation: !data.session };
    },
  });
}

export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      // Full-page redirect to Google; the session is picked up from the URL on return.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    },
  });
}

export function useSignOut() {
  // Cache clearing happens in `useAuthListener` on SIGNED_OUT, so it also covers
  // sign-outs that originate in another tab.
  return useMutation({
    mutationFn: async () => {
      // Deletes still waiting behind an Undo toast need the session to go through.
      await pendingDeletes.flush();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });
}
