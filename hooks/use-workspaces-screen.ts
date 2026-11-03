import { useRouter } from 'expo-router';

import { useWorkspace } from '@/contexts/workspace';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';

/** Screen hook for Workspaces: links to the active workspace's settings, create and invites. */
export function useWorkspacesScreen() {
  const router = useRouter();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();

  return {
    workspaceName: currentWorkspace?.name,
    pendingInviteCount: pendingInvites.length,
    openWorkspaceSettings: () => {
      if (!currentWorkspaceId) return;
      router.push({ pathname: '/workspace-settings', params: { id: currentWorkspaceId } });
    },
    openCreateWorkspace: () => router.push('/create-workspace'),
    openInvites: () => router.push('/workspace-invites'),
  };
}
