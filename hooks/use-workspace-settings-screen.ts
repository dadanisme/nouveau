import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useRevokeInvite, useWorkspaceInvites } from '@/hooks/use-workspace-invites';
import {
  useLeaveWorkspace,
  useRemoveMember,
  useWorkspaceMembers,
} from '@/hooks/use-workspace-members';
import {
  useDeleteWorkspace,
  useMyWorkspaces,
  useUpdateWorkspace,
  useWorkspace as useWorkspaceQuery,
} from '@/hooks/use-workspaces';
import { confirmDestructive as confirmDestructiveAction } from '@/lib/confirm-destructive';
import { k } from '@/locales/keys';
import { formatShortDate } from '@/utils/date';
import { getErrorCode, getErrorMessage } from '@/utils/error';
import { getHomeCurrencyOptions } from '@/utils/workspace';

/** Postgres foreign key violation: the workspace still has rows (categories, transactions). */
const FOREIGN_KEY_VIOLATION = '23503';

/**
 * Screen hook for Workspace Settings (`?id=`): the owner edits the name and home currency (saved
 * from the header), removes members and revokes or sends invites, and deletes a shared workspace;
 * a member sees read-only details and can leave. Destructive actions confirm with a native alert,
 * failures show one. Going back with an unsaved name or currency is confirmed first.
 */
export function useWorkspaceSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { session } = useSession();
  const { currentWorkspaceId, switchWorkspace } = useWorkspace();
  const userId = session?.user.id;

  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspaceQuery(id);
  const { data: members = [], isLoading: isMembersLoading } = useWorkspaceMembers(id);
  const { data: invites = [], isLoading: isInvitesLoading } = useWorkspaceInvites(id);
  const { data: allWorkspaces = [] } = useMyWorkspaces();

  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const removeMember = useRemoveMember();
  const leaveWorkspace = useLeaveWorkspace();
  const revokeInvite = useRevokeInvite();

  // Edits over the loaded values; null means untouched (shows the saved value).
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [currencyDraft, setCurrencyDraft] = useState<string | null>(null);

  const name = nameDraft ?? workspace?.name ?? '';
  const currency = currencyDraft ?? workspace?.home_currency ?? '';

  const isOwner = !!workspace && !!userId && workspace.owner_id === userId;
  const isPersonal = workspace?.is_personal ?? false;
  const isDirty =
    !!workspace && (name.trim() !== workspace.name || currency !== workspace.home_currency);
  const canSave = isOwner && isDirty && name.trim().length > 0 && !updateWorkspace.isPending;
  const leave = useDiscardGuard(isOwner && isDirty, { pushed: true });

  function showError(title: string, error: unknown) {
    Alert.alert(title, getErrorMessage(error, t(k.common.unexpectedError)));
  }

  /** The destructive confirmation (an action sheet on iOS): Cancel plus a red confirm button. */
  function confirmDestructive(
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) {
    confirmDestructiveAction({ title, message, confirmLabel, onConfirm });
  }

  function save() {
    if (!workspace || !canSave) return;
    updateWorkspace.mutate(
      { id: workspace.id, name: name.trim(), home_currency: currency },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error) => showError(t(k.workspace.failedToUpdate), error),
      },
    );
  }

  /** After leaving/deleting: if it was the active workspace, fall back to the personal one. */
  async function closeAfterRemoval(removedId: string) {
    if (currentWorkspaceId === removedId) {
      const fallback =
        allWorkspaces.find((w) => w.is_personal && w.id !== removedId) ??
        allWorkspaces.find((w) => w.id !== removedId);
      if (fallback) await switchWorkspace(fallback.id);
    }
    leave(() => router.back());
  }

  function confirmLeave() {
    if (!workspace) return;
    const workspaceId = workspace.id;
    confirmDestructive(
      t(k.workspace.confirmLeave),
      t(k.workspace.confirmLeaveMessage),
      t(k.workspace.leaveWorkspace),
      () =>
        leaveWorkspace.mutate(workspaceId, {
          onSuccess: () => closeAfterRemoval(workspaceId),
          onError: (error) => showError(t(k.workspace.failedToLeave), error),
        }),
    );
  }

  function confirmDelete() {
    if (!workspace) return;
    const workspaceId = workspace.id;
    confirmDestructive(
      t(k.workspace.confirmDelete),
      t(k.workspace.confirmDeleteMessage),
      t(k.workspace.deleteWorkspace),
      () =>
        deleteWorkspace.mutate(workspaceId, {
          onSuccess: () => closeAfterRemoval(workspaceId),
          onError: (error) =>
            getErrorCode(error) === FOREIGN_KEY_VIOLATION
              ? Alert.alert(t(k.workspace.failedToDelete), t(k.workspace.errorDeleteHasData))
              : showError(t(k.workspace.failedToDelete), error),
        }),
    );
  }

  const memberRows = members.map((member) => {
    const displayName = member.users?.display_name || member.users?.email || t(k.settings.unknown);
    const isSelf = member.user_id === userId;
    const isMemberOwner = member.role === 'owner';
    const canRemove = isOwner && !isSelf && !isMemberOwner;
    return {
      id: member.user_id,
      name: isSelf ? `${displayName} (${t(k.workspace.you)})` : displayName,
      role: isMemberOwner ? t(k.workspace.owner) : t(k.workspace.member),
      remove: canRemove
        ? () =>
            confirmDestructive(
              t(k.workspace.confirmRemove, { name: displayName }),
              t(k.workspace.confirmRemoveMessage),
              t(k.workspace.remove),
              () =>
                removeMember.mutate(
                  { workspace_id: member.workspace_id, user_id: member.user_id },
                  { onError: (error) => showError(t(k.workspace.failedToRemove), error) },
                ),
            )
        : undefined,
    };
  });

  const inviteRows = invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    expires: t(k.workspace.expiresAt, { date: formatShortDate(invite.expires_at) }),
    revoke: () =>
      confirmDestructive(
        t(k.workspace.confirmRevoke, { email: invite.email }),
        t(k.workspace.confirmRevokeMessage),
        t(k.workspace.revoke),
        () =>
          revokeInvite.mutate(
            { id: invite.id, workspace_id: invite.workspace_id },
            { onError: (error) => showError(t(k.workspace.failedToRevoke), error) },
          ),
      ),
  }));

  return {
    /** A first fetch is in flight: the screen shows a loading row instead of the form. */
    isLoading: isWorkspaceLoading || isMembersLoading || isInvitesLoading,
    isLoaded: !!workspace,
    isOwner,
    isPersonal,
    name,
    setName: setNameDraft,
    currency,
    setCurrency: setCurrencyDraft,
    currencyOptions: getHomeCurrencyOptions(workspace?.home_currency),
    canSave,
    isSaving: updateWorkspace.isPending,
    save,
    members: memberRows,
    membersTitle: t(k.workspace.members),
    invites: inviteRows,
    openInviteSheet: () => {
      if (!workspace) return;
      router.push({ pathname: '/workspace-invite', params: { workspaceId: workspace.id } });
    },
    isRemoving: leaveWorkspace.isPending || deleteWorkspace.isPending,
    confirmLeave,
    confirmDelete,
  };
}
