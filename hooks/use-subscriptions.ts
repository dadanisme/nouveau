import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_subscriptions')
        .select('*, feature:features(*)')
        .eq('user_id', userId!)
        .order('granted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
