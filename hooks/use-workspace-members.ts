import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-auth';
import { useDataSource } from '@/hooks/use-data-source';
import { supabase } from '@/lib/supabase';
import { toWorkspaceMemberRows } from '@/utils/workspace-member';

/**
 * A workspace's members, with their names. Account only: a guest's workspace has no members table.
 * Read through the `workspace_member_profiles` view: `public.users` lets a person read only their
 * own row, so embedding `users(...)` under `workspace_members` returned null for everyone else.
 */
export function useWorkspaceMembers(workspaceId: string | null | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_member_profiles')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return toWorkspaceMemberRows(data ?? []);
    },
    enabled: source?.kind === 'remote' && !!workspaceId,
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { workspace_id: string; user_id: string }) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .match({ workspace_id: args.workspace_id, user_id: args.user_id });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', variables.workspace_id] });
    },
  });
}

export function useLeaveWorkspace() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .match({ workspace_id: workspaceId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
    },
  });
}
