import { useRouter } from 'expo-router';
import { useRef } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { useMyWorkspaces } from '@/hooks/use-workspaces';

/** Screen hook for the `workspace-switcher` sheet route: switches the active workspace and closes. */
export function useWorkspaceSwitcherSheet() {
  const router = useRouter();
  const { currentWorkspaceId, switchWorkspace } = useWorkspace();
  const { data: workspaces = [] } = useMyWorkspaces();
  // Only the first tap counts, so a double tap can't pop the screen underneath.
  const selectedRef = useRef(false);

  function selectWorkspace(id: string) {
    if (selectedRef.current) return;
    selectedRef.current = true;
    if (id !== currentWorkspaceId) switchWorkspace(id);
    router.back();
  }

  return { workspaces, currentWorkspaceId, selectWorkspace };
}
