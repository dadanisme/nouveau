import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import {
  useAcceptInvite,
  useDeclineWorkspaceInvite,
  useMyPendingInvites,
} from '@/hooks/use-workspace-invites';
import { showAlertDialog } from '@/lib/alert-dialog';
import { confirmDestructive } from '@/lib/confirm-destructive';
import { k } from '@/locales/keys';
import { formatShortDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/error';

/**
 * Screen hook for Invitations (the invites sent to me): accepting one joins and switches to
 * that workspace, then closes the screen; declining one (after a native confirm) drops it from
 * the list. Failures show a native alert. One invite is handled at a time.
 */
export function useWorkspaceInvitesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const { data: invites = [], isLoading } = useMyPendingInvites();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineWorkspaceInvite();
  const [busy, setBusy] = useState<{ id: string; action: 'accept' | 'decline' } | null>(null);

  function showError(title: string, error: unknown) {
    showAlertDialog(title, getErrorMessage(error, t(k.common.unexpectedError)));
  }

  function accept(inviteId: string, token: string) {
    if (busy) return;
    setBusy({ id: inviteId, action: 'accept' });
    acceptInvite.mutate(token, {
      onSuccess: async (newWorkspaceId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (newWorkspaceId) await switchWorkspace(newWorkspaceId);
        setBusy(null);
        router.back();
      },
      onError: (error) => {
        setBusy(null);
        showError(t(k.workspace.failedToAccept), error);
      },
    });
  }

  function confirmDecline(inviteId: string, token: string, workspaceName: string) {
    if (busy) return;
    confirmDestructive({
      title: t(k.workspace.confirmDecline, { name: workspaceName }),
      message: t(k.workspace.confirmDeclineMessage),
      confirmLabel: t(k.workspace.decline),
      onConfirm: () => {
        setBusy({ id: inviteId, action: 'decline' });
        declineInvite.mutate(token, {
          onSettled: () => setBusy(null),
          onError: (error) => showError(t(k.workspace.failedToDecline), error),
        });
      },
    });
  }

  return {
    /** The first fetch is in flight: the screen shows a loading row. */
    isLoading,
    isEmpty: !isLoading && invites.length === 0,
    invites: invites.map((invite) => {
      const workspaceName = invite.workspaces?.name ?? t(k.workspace.shared);
      const isAccepting = busy?.id === invite.id && busy.action === 'accept';
      const isDeclining = busy?.id === invite.id && busy.action === 'decline';
      return {
        id: invite.id,
        workspaceName,
        expires: t(k.workspace.expiresAt, { date: formatShortDate(invite.expires_at) }),
        acceptTitle: isAccepting ? t(k.workspace.accepting) : t(k.workspace.accept),
        declineTitle: isDeclining ? t(k.workspace.declining) : t(k.workspace.decline),
        isAccepting,
        isDeclining,
        disabled: busy !== null,
        accept: () => accept(invite.id, invite.token),
        decline: () => confirmDecline(invite.id, invite.token, workspaceName),
      };
    }),
  };
}
