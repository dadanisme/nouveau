import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-auth';
import { useDataSource } from '@/hooks/use-data-source';
import { supabase } from '@/lib/supabase';

export type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users: {
    id: string;
    display_name: string | null;
    email: string | null;
    profile_image: string | null;
  } | null;
};

/** A workspace's members. Account only: a guest's workspace has no members table. */
export function useWorkspaceMembers(workspaceId: string | null | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, users(id, display_name, email, profile_image)')
        .eq('workspace_id', workspaceId!)
        .order('joined_at', { ascending: true })
        .returns<WorkspaceMemberRow[]>();
      if (error) throw error;
      return data ?? [];
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
