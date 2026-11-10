import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSession, useUserProfile } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { parseAiConsent, type AiConsent } from '@/utils/ai-consent';

function profileKey(userId: string | undefined) {
  return ['user-profile', userId];
}

/**
 * The signed-in account's AI consent (#122, `users.ai_consent`), read from its profile row (the
 * `user-profile` query, so a profile refetch keeps it current). Null until answered, and with no
 * session. `refresh()` reads it from the server again, for when the server refused an AI call
 * with `ai_consent_required` (it was changed on another device).
 */
export function useAiConsent() {
  const { session } = useSession();
  const userId = session?.user.id;
  const profile = useUserProfile(userId);

  async function refresh(): Promise<AiConsent> {
    if (!userId) return null;
    const result = await profile.refetch();
    return parseAiConsent(result.data?.ai_consent);
  }

  return {
    consent: parseAiConsent(profile.data?.ai_consent),
    /** The stored answer has loaded (an account's profile row is in). */
    isKnown: !!userId && profile.isSuccess,
    refresh,
  };
}

/**
 * Stores the AI consent answer with the time it was given (`users.ai_consent` and
 * `ai_consent_updated_at`; RLS `users_update_own`). The profile query shows it at once and goes
 * back if the save fails, so Settings' toggle follows the tap.
 */
export function useSetAiConsent() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (consent: 'granted' | 'declined') => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('users')
        .update({ ai_consent: consent, ai_consent_updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (consent) => {
      const key = profileKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Tables<'users'>>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ai_consent: consent });
      return { previous };
    },
    onError: (_error, _consent, context) => {
      if (context?.previous) queryClient.setQueryData(profileKey(userId), context.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKey(data.id), data);
    },
  });
}
