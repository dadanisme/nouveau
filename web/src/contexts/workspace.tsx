import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { WorkspaceContext } from '@/contexts/workspace-context';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { useMyWorkspaces, useSetActiveWorkspace } from '@/hooks/use-workspaces';
import { readStoredWorkspaceId, writeStoredWorkspaceId } from '@/lib/workspace-storage';
import { resolveActiveWorkspaceId } from '@/utils/workspace';

/** Query keys that hold workspace-scoped data (same list the mobile app invalidates). */
const WORKSPACE_SCOPED_QUERY_KEYS = [
  'transactions',
  'transactions-year',
  'categories',
  'workspace-balance',
  'workspace-monthly-totals',
  'proofs',
  'my-pending-invites',
  'workspaces',
];

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const workspacesQuery = useMyWorkspaces();
  const profileQuery = useUserProfile(userId);
  const { mutate: setActiveWorkspace } = useSetActiveWorkspace();

  const [selectedId, setSelectedId] = useState<string | null>(readStoredWorkspaceId);

  const workspaces = workspacesQuery.data;
  const isLoading = workspacesQuery.isPending || profileQuery.isPending;

  // Until the membership list has loaded, trust the stored id so the UI does not flicker.
  const currentWorkspaceId = useMemo(() => {
    if (!workspaces || isLoading) return selectedId;
    return resolveActiveWorkspaceId(
      workspaces.map((workspace) => workspace.id),
      selectedId,
      profileQuery.data?.active_workspace_id,
    );
  }, [workspaces, isLoading, selectedId, profileQuery.data?.active_workspace_id]);

  // `authenticatedFetch` reads the id from localStorage, so keep it in step.
  useEffect(() => {
    if (currentWorkspaceId) writeStoredWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  const switchWorkspace = useCallback(
    (id: string) => {
      writeStoredWorkspaceId(id);
      setSelectedId(id);
      if (userId) setActiveWorkspace({ userId, workspaceId: id });
      for (const key of WORKSPACE_SCOPED_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    [userId, setActiveWorkspace, queryClient],
  );

  const value = useMemo(
    () => ({
      currentWorkspaceId,
      currentWorkspace:
        workspaces?.find((workspace) => workspace.id === currentWorkspaceId) ?? null,
      workspaces: workspaces ?? [],
      switchWorkspace,
      isLoading,
    }),
    [currentWorkspaceId, workspaces, switchWorkspace, isLoading],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
