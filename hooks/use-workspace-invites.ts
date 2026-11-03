import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export type WorkspaceInviteWithWorkspace = {
  id: string;
  workspace_id: string;
  email: string;
  invited_by: string;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  workspaces: { name: string; home_currency: string } | null;
};

/**
 * Pending invites addressed to me. Filtered on my email: RLS also lets members read every invite
 * of their workspaces, which would list the invites an owner sent. Invite emails are stored
 * lowercased (`create_workspace_invite`).
 */
export function useMyPendingInvites() {
  const { session } = useSession();
  const userId = session?.user.id;
  const email = session?.user.email?.toLowerCase();
  return useQuery({
    queryKey: ['my-pending-invites', userId, email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_invites')
        .select('*, workspaces(name, home_currency)')
        .eq('status', 'pending')
        .eq('email', email!)
        .order('created_at', { ascending: false })
        .returns<WorkspaceInviteWithWorkspace[]>();
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && !!email,
  });
}

export function useWorkspaceInvites(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['workspace-invites', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_invites')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      workspace_id: string;
      email: string;
      expires_in_hours?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_workspace_invite', {
        workspace_id: args.workspace_id,
        email: args.email,
        expires_in_hours: args.expires_in_hours ?? 168,
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', variables.workspace_id] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_workspace_invite', { token });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/** Declines an invite addressed to me (`decline_workspace_invite`, invitee only). */
export function useDeclineWorkspaceInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.rpc('decline_workspace_invite', { token });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; workspace_id: string }) => {
      const { error } = await supabase
        .from('workspace_invites')
        .update({ status: 'revoked' })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', variables.workspace_id] });
    },
  });
}
