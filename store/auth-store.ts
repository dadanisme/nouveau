import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type User = Tables<'users'>;

interface AuthState {
  session: Session | null;
  user: User | null;
  userError: string | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  userError: null,
  isLoading: true,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setUserError: (error) => set({ userError: error }),
  setIsLoading: (isLoading) => set({ isLoading }),

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUpWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signInWithGoogle: async () => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      throw new Error('No ID token received from Google Sign-In');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    });

    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));

export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      session: state.session,
      user: state.user,
      userError: state.userError,
      isLoading: state.isLoading,
      signInWithEmail: state.signInWithEmail,
      signUpWithEmail: state.signUpWithEmail,
      signInWithGoogle: state.signInWithGoogle,
      signOut: state.signOut,
    })),
  );
}
