import { useRouter } from 'expo-router';

import { useWorkspace } from '@/contexts/workspace';
import { useSignInPrompt } from '@/hooks/use-sign-in-prompt';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';

/**
 * Screen hook for Workspaces: links to the active workspace's settings, create and invites. Create
 * and the invitations are account only: a guest (#100) gets the sign-in prompt instead.
 */
export function useWorkspacesScreen() {
  const router = useRouter();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();
  const { requireAccount } = useSignInPrompt();

  return {
    workspaceName: currentWorkspace?.name,
    pendingInviteCount: pendingInvites.length,
    openWorkspaceSettings: () => {
      if (!currentWorkspaceId) return;
      router.push({ pathname: '/workspace-settings', params: { id: currentWorkspaceId } });
    },
    openCreateWorkspace: () =>
      requireAccount('createWorkspace', () => router.push('/create-workspace')),
    openInvites: () => requireAccount('joinWorkspace', () => router.push('/workspace-invites')),
  };
}
