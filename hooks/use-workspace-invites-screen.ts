import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useAcceptInvite, useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { k } from '@/locales/keys';
import { formatShortDate } from '@/utils/date';

/**
 * Screen hook for Pending Invites (the invites sent to me): accepting one joins and switches to
 * that workspace, then closes the screen. A failure shows a native alert.
 */
export function useWorkspaceInvitesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const { data: invites = [], isLoading } = useMyPendingInvites();
  const acceptInvite = useAcceptInvite();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  function accept(inviteId: string, token: string) {
    if (acceptingId) return;
    setAcceptingId(inviteId);
    acceptInvite.mutate(token, {
      onSuccess: async (newWorkspaceId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (newWorkspaceId) await switchWorkspace(newWorkspaceId);
        setAcceptingId(null);
        router.back();
      },
      onError: (error) => {
        setAcceptingId(null);
        Alert.alert(
          t(k.workspace.failedToAccept),
          error instanceof Error ? error.message : t(k.common.unexpectedError),
        );
      },
    });
  }

  return {
    isEmpty: !isLoading && invites.length === 0,
    invites: invites.map((invite) => ({
      id: invite.id,
      workspaceName: invite.workspaces?.name ?? t(k.workspace.shared),
      expires: t(k.workspace.expiresAt, { date: formatShortDate(invite.expires_at) }),
      acceptTitle: acceptingId === invite.id ? t(k.workspace.accepting) : t(k.workspace.accept),
      acceptDisabled: acceptingId !== null,
      accept: () => accept(invite.id, invite.token),
    })),
  };
}
