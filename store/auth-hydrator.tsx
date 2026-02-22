import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { useAuthStore } from './auth-store';

type User = Tables<'users'>;

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    console.error('Failed to fetch user profile:', error.message);
    return null;
  }

  return data;
}

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const { setSession, setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id).then(setUser);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id).then(setUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setIsLoading]);

  return children;
}
