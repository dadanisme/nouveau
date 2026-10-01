import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { SESSION_QUERY_KEY } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { clearStoredWorkspaceId } from '@/lib/workspace-storage';

/**
 * Keeps the React Query session cache in sync with Supabase auth and re-runs the route
 * guards whenever the signed-in user changes (sign-in, sign-out, other tab).
 */
export function useAuthListener() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const previous = queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY);

      if (event === 'SIGNED_OUT') {
        clearStoredWorkspaceId();
        queryClient.clear();
      }
      queryClient.setQueryData(SESSION_QUERY_KEY, session);

      if ((previous?.user.id ?? null) !== (session?.user.id ?? null)) {
        void router.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);
}
