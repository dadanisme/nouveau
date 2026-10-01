import { createContext, useContext } from 'react';

import type { Tables } from '@/types/supabase';

export type Workspace = Tables<'workspaces'>;

export interface WorkspaceContextValue {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (id: string) => void;
  isLoading: boolean;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
