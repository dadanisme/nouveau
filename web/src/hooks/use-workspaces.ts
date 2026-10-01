import { useMutation, useQuery } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export function useMyWorkspaces() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['workspaces', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*, workspace_members!inner(user_id)')
        .eq('workspace_members.user_id', userId!)
        .order('is_personal', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(({ workspace_members: _, ...workspace }) => workspace);
    },
    enabled: !!userId,
  });
}

/** Persists the active workspace on the user row, as mobile does, so it follows the account. */
export function useSetActiveWorkspace() {
  return useMutation({
    mutationFn: async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ active_workspace_id: workspaceId })
        .eq('id', userId);
      if (error) throw error;
    },
  });
}
