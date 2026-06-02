import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useSession } from '@/hooks/use-auth';
import { useWorkspace as useWorkspaceQuery } from '@/hooks/use-workspaces';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

export const WORKSPACE_STORAGE_KEY = 'active_workspace_id';

type Workspace = Tables<'workspaces'>;

interface WorkspaceContextValue {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  switchWorkspace: (id: string) => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function readStoredWorkspaceId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(
    readStoredWorkspaceId,
  );
  const [isResolving, setIsResolving] = useState(currentWorkspaceId === null);
  const recoveredStaleIdsRef = useRef<Set<string>>(new Set());

  // Resolve workspace from server when local state is empty
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!userId) {
        setIsResolving(false);
        return;
      }
      if (currentWorkspaceId) {
        setIsResolving(false);
        return;
      }

      setIsResolving(true);

      const { data: user } = await supabase
        .from('users')
        .select('active_workspace_id')
        .eq('id', userId)
        .single();

      let resolved = user?.active_workspace_id ?? null;
      // Skip ids we already recovered from this session
      if (resolved && recoveredStaleIdsRef.current.has(resolved)) {
        resolved = null;
      }

      if (!resolved) {
        const { data: memberships } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', userId);
        resolved =
          memberships?.find((m) => !recoveredStaleIdsRef.current.has(m.workspace_id))
            ?.workspace_id ?? null;
      }

      if (cancelled) return;

      if (resolved) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, resolved);
        setCurrentWorkspaceIdState(resolved);
      }
      setIsResolving(false);
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [userId, currentWorkspaceId]);

  // Clear local workspace on sign-out
  useEffect(() => {
    if (!session && currentWorkspaceId !== null) {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      setCurrentWorkspaceIdState(null);
      recoveredStaleIdsRef.current.clear();
    }
  }, [session, currentWorkspaceId]);

  const currentWorkspaceQuery = useWorkspaceQuery(currentWorkspaceId);

  // Recover from stale workspace id (deleted workspace or removed membership)
  useEffect(() => {
    if (!currentWorkspaceQuery.isError || !currentWorkspaceId || !userId) return;
    if (recoveredStaleIdsRef.current.has(currentWorkspaceId)) return;

    const staleId = currentWorkspaceId;
    recoveredStaleIdsRef.current.add(staleId);

    let cancelled = false;
    async function recover() {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      // Clear the server-side pointer too so re-resolve doesn't pick it again
      await supabase
        .from('users')
        .update({ active_workspace_id: null })
        .eq('id', userId!)
        .eq('active_workspace_id', staleId);
      if (cancelled) return;
      setCurrentWorkspaceIdState(null);
    }
    recover();
    return () => {
      cancelled = true;
    };
  }, [currentWorkspaceQuery.isError, currentWorkspaceId, userId]);

  const switchWorkspace = useCallback(
    async (id: string) => {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
      setCurrentWorkspaceIdState(id);

      if (userId) {
        await supabase.from('users').update({ active_workspace_id: id }).eq('id', userId);
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-year'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-balance'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-monthly-totals'] });
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    [userId, queryClient],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        currentWorkspace: currentWorkspaceQuery.data ?? null,
        switchWorkspace,
        isLoading: isResolving,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
