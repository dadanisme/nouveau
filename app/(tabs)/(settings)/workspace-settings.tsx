import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { WorkspaceInvitesSection } from '@/components/workspace-invites-section';
import { WorkspaceMembersSection } from '@/components/workspace-members-section';
import { colors, design } from '@/constants/colors';
import { COMMON_CURRENCIES } from '@/constants/currencies';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import {
  useLeaveWorkspace,
  useRemoveMember,
  useWorkspaceMembers,
} from '@/hooks/use-workspace-members';
import { useRevokeInvite, useWorkspaceInvites } from '@/hooks/use-workspace-invites';
import {
  useDeleteWorkspace,
  useMyWorkspaces,
  useUpdateWorkspace,
  useWorkspace as useWorkspaceQuery,
} from '@/hooks/use-workspaces';
import { k } from '@/locales/keys';

export default function WorkspaceSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { session } = useSession();
  const { switchWorkspace } = useWorkspace();
  const userId = session?.user.id;

  const { data: workspace } = useWorkspaceQuery(id);
  const { data: members = [] } = useWorkspaceMembers(id);
  const { data: invites = [] } = useWorkspaceInvites(id);
  const { data: allWorkspaces = [] } = useMyWorkspaces();

  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const removeMember = useRemoveMember();
  const leaveWorkspace = useLeaveWorkspace();
  const revokeInvite = useRevokeInvite();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('IDR');

  useEffect(() => {
    if (workspace) {
      // Seeds the form from the loaded workspace; this screen is rebuilt natively in its own issue.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(workspace.name);
      setCurrency(workspace.home_currency);
    }
  }, [workspace]);

  const isOwner = !!workspace && !!userId && workspace.owner_id === userId;
  const isPersonal = workspace?.is_personal ?? false;
  const isDirty = workspace && (name !== workspace.name || currency !== workspace.home_currency);

  function showError(title: string, error: unknown) {
    Alert.alert(title, error instanceof Error ? error.message : t(k.common.unexpectedError));
  }

  /** Native confirmation alert: Cancel plus a destructive confirm button. */
  function confirmDestructive(
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
  ) {
    Alert.alert(title, message, [
      { text: t(k.common.cancel), style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }

  function handleSave() {
    if (!workspace || !isDirty) return;
    updateWorkspace.mutate(
      { id: workspace.id, name: name.trim(), home_currency: currency },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error) => {
          showError(t(k.workspace.failedToUpdate), error);
        },
      },
    );
  }

  function handleRevoke(inviteId: string) {
    if (!workspace) return;
    const workspaceId = workspace.id;
    const email = invites.find((inv) => inv.id === inviteId)?.email ?? '';
    confirmDestructive(
      t(k.workspace.confirmRevoke, { email }),
      t(k.workspace.confirmRevokeMessage),
      t(k.workspace.revoke),
      () => {
        revokeInvite.mutate(
          { id: inviteId, workspace_id: workspaceId },
          {
            onError: (error) => {
              showError(t(k.workspace.failedToRevoke), error);
            },
          },
        );
      },
    );
  }

  async function switchToFallbackAndBack() {
    const fallback = allWorkspaces.find((w) => w.is_personal) ?? allWorkspaces[0];
    if (fallback && fallback.id !== workspace?.id) {
      await switchWorkspace(fallback.id);
    }
    router.back();
  }

  function handleLeave() {
    if (!workspace) return;
    leaveWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        switchToFallbackAndBack();
      },
      onError: (error) => {
        showError(t(k.workspace.failedToLeave), error);
      },
    });
  }

  function handleDelete() {
    if (!workspace) return;
    deleteWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        switchToFallbackAndBack();
      },
      onError: (error) => {
        showError(t(k.workspace.failedToDelete), error);
      },
    });
  }

  function handleRemoveMember(targetUserId: string) {
    if (!workspace) return;
    removeMember.mutate(
      { workspace_id: workspace.id, user_id: targetUserId },
      {
        onError: (error) => {
          showError(t(k.workspace.failedToRemove), error);
        },
      },
    );
  }

  function requestLeave() {
    confirmDestructive(
      t(k.workspace.confirmLeave),
      t(k.workspace.confirmLeaveMessage),
      t(k.workspace.leaveWorkspace),
      handleLeave,
    );
  }

  function requestDelete() {
    confirmDestructive(
      t(k.workspace.confirmDelete),
      t(k.workspace.confirmDeleteMessage),
      t(k.workspace.deleteWorkspace),
      handleDelete,
    );
  }

  function requestRemoveMember(member: { user_id: string; name: string }) {
    confirmDestructive(
      t(k.workspace.confirmRemove, { name: member.name }),
      t(k.workspace.confirmRemoveMessage),
      t(k.workspace.remove),
      () => handleRemoveMember(member.user_id),
    );
  }

  function openInviteSheet() {
    if (!workspace) return;
    router.push({ pathname: '/workspace-invite', params: { workspaceId: workspace.id } });
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t(k.workspace.workspaceName)}</Text>
        <Card style={styles.inputCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            editable={isOwner}
            placeholderTextColor={colors.gray[400]}
            style={[styles.input, !isOwner && styles.inputDisabled]}
          />
        </Card>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t(k.workspace.homeCurrency)}</Text>
        <View style={styles.currencyRow}>
          {COMMON_CURRENCIES.map((code) => {
            const active = code === currency;
            return (
              <Button
                key={code}
                variant={active ? 'dark' : 'outline'}
                style={StyleSheet.flatten([
                  styles.currencyPill,
                  active && { backgroundColor: colors.primary.DEFAULT },
                ])}
                onPress={() => isOwner && setCurrency(code)}
                disabled={!isOwner}
              >
                <Text style={[styles.currencyText, active && styles.currencyTextActive]}>
                  {code}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      {isOwner && isDirty && (
        <Button variant="primary" onPress={handleSave} style={styles.saveButton}>
          <Ionicons name="checkmark" size={20} color={colors.black} />
          <Text style={styles.saveText}>{t(k.common.save)}</Text>
        </Button>
      )}

      <WorkspaceMembersSection
        members={members}
        currentUserId={userId}
        isOwner={isOwner}
        onRemoveMember={requestRemoveMember}
      />

      {isOwner && (
        <>
          <WorkspaceInvitesSection invites={invites} onRevoke={handleRevoke} />
          <Button variant="primary" onPress={openInviteSheet} style={styles.inviteButton}>
            <Ionicons name="person-add-outline" size={20} color={colors.black} />
            <Text style={styles.inviteButtonText}>{t(k.workspace.inviteMember)}</Text>
          </Button>
        </>
      )}

      {!isPersonal && (
        <View style={styles.footer}>
          {isOwner ? (
            <Button onPress={requestDelete} style={styles.dangerButton}>
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={styles.dangerButtonText}>{t(k.workspace.deleteWorkspace)}</Text>
            </Button>
          ) : (
            <Button variant="outline" onPress={requestLeave} style={styles.leaveButton}>
              <Ionicons name="exit-outline" size={20} color={colors.expense} />
              <Text style={styles.leaveButtonText}>{t(k.workspace.leaveWorkspace)}</Text>
            </Button>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
    paddingBottom: design.spacing.lg,
    gap: design.spacing.md,
  },
  fieldGroup: {
    gap: design.spacing.sm,
  },
  fieldLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    paddingVertical: design.spacing.sm + 2,
  },
  input: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
    padding: 0,
  },
  inputDisabled: {
    color: colors.gray[500],
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: design.spacing.sm,
  },
  currencyPill: {
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.md,
  },
  currencyText: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
  currencyTextActive: {
    color: colors.black,
  },
  saveButton: {
    marginTop: design.spacing.xs,
  },
  saveText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
  inviteButton: {
    marginTop: design.spacing.xs,
  },
  inviteButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
  footer: {
    marginTop: design.spacing.xl,
  },
  dangerButton: {
    backgroundColor: colors.expense,
  },
  dangerButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.white,
  },
  leaveButton: {
    borderColor: colors.expense,
  },
  leaveButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.expense,
  },
});
