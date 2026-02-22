import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type User = Tables<'users'>;

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),

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
  return useAuthStore((state) => ({
    session: state.session,
    user: state.user,
    isLoading: state.isLoading,
    signInWithGoogle: state.signInWithGoogle,
    signOut: state.signOut,
  }));
}
