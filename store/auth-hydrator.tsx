import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { useAuthStore } from './auth-store';

type User = Tables<'users'>;

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    console.error('Failed to fetch user profile:', error.message);
    throw new Error(error.message);
  }

  return data;
}

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const { setSession, setUser, setUserError, setIsLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id)
          .then((user) => {
            setUser(user);
            setUserError(null);
          })
          .catch((err: Error) => {
            setUser(null);
            setUserError(err.message);
          });
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id)
          .then((user) => {
            setUser(user);
            setUserError(null);
          })
          .catch((err: Error) => {
            setUser(null);
            setUserError(err.message);
          });
      } else {
        setUser(null);
        setUserError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setUserError, setIsLoading]);

  return children;
}
