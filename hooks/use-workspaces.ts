import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { requireDataSource, useCurrentUserId, useDataSource } from '@/hooks/use-data-source';
import type { TablesUpdate } from '@/types/supabase';

export function useMyWorkspaces() {
  const source = useDataSource();
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['workspaces', userId],
    queryFn: () => source!.getMyWorkspaces(userId!),
    enabled: !!source && !!userId,
  });
}

export function useWorkspace(workspaceId: string | null | undefined) {
  const source = useDataSource();
  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => source!.getWorkspace(workspaceId!),
    enabled: !!source && !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: (args: { name: string; home_currency?: string }) =>
      requireDataSource(source).createWorkspace(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'workspaces'> & { id: string }) => {
      await requireDataSource(source).updateWorkspace(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const source = useDataSource();

  return useMutation({
    mutationFn: async (id: string) => {
      await requireDataSource(source).deleteWorkspace(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
