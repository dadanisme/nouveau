import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/types/supabase';

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

export function useWorkspace(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { name: string; home_currency?: string }) => {
      const { data, error } = await supabase.rpc('create_workspace', {
        name: args.name,
        home_currency: args.home_currency,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'workspaces'> & { id: string }) => {
      const { error } = await supabase.from('workspaces').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
