import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { WorkspaceInviteSheet } from '@/components/workspace-invite-sheet';
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
  const insets = useSafeAreaInsets();
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
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | null
    | { kind: 'leave' }
    | { kind: 'delete' }
    | { kind: 'remove'; user_id: string; name: string }
  >(null);
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setCurrency(workspace.home_currency);
    }
  }, [workspace]);

  const isOwner = !!workspace && !!userId && workspace.owner_id === userId;
  const isPersonal = workspace?.is_personal ?? false;
  const isDirty = workspace && (name !== workspace.name || currency !== workspace.home_currency);

  function handleSave() {
    if (!workspace || !isDirty) return;
    updateWorkspace.mutate(
      { id: workspace.id, name: name.trim(), home_currency: currency },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error) => {
          setAlert({
            title: t(k.workspace.failedToUpdate),
            message: error instanceof Error ? error.message : t(k.common.unexpectedError),
          });
        },
      },
    );
  }

  function handleRevoke(inviteId: string) {
    if (!workspace) return;
    revokeInvite.mutate(
      { id: inviteId, workspace_id: workspace.id },
      {
        onError: (error) => {
          setAlert({
            title: t(k.workspace.failedToRevoke),
            message: error instanceof Error ? error.message : t(k.common.unexpectedError),
          });
        },
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
        setPendingAction(null);
        switchToFallbackAndBack();
      },
      onError: (error) => {
        setPendingAction(null);
        setAlert({
          title: t(k.workspace.failedToLeave),
          message: error instanceof Error ? error.message : t(k.common.unexpectedError),
        });
      },
    });
  }

  function handleDelete() {
    if (!workspace) return;
    deleteWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        setPendingAction(null);
        switchToFallbackAndBack();
      },
      onError: (error) => {
        setPendingAction(null);
        setAlert({
          title: t(k.workspace.failedToDelete),
          message: error instanceof Error ? error.message : t(k.common.unexpectedError),
        });
      },
    });
  }

  function handleRemoveMember(targetUserId: string) {
    if (!workspace) return;
    removeMember.mutate(
      { workspace_id: workspace.id, user_id: targetUserId },
      {
        onSuccess: () => setPendingAction(null),
        onError: (error) => {
          setPendingAction(null);
          setAlert({
            title: t(k.workspace.failedToRemove),
            message: error instanceof Error ? error.message : t(k.common.unexpectedError),
          });
        },
      },
    );
  }

  const confirmAction = useMemo(() => {
    if (!pendingAction) return null;
    if (pendingAction.kind === 'leave') {
      return {
        title: t(k.workspace.confirmLeave),
        message: t(k.workspace.confirmLeaveMessage),
        confirmLabel: t(k.workspace.leaveWorkspace),
        onConfirm: handleLeave,
      };
    }
    if (pendingAction.kind === 'delete') {
      return {
        title: t(k.workspace.confirmDelete),
        message: t(k.workspace.confirmDeleteMessage),
        confirmLabel: t(k.workspace.deleteWorkspace),
        onConfirm: handleDelete,
      };
    }
    return {
      title: t(k.workspace.confirmRemove, { name: pendingAction.name }),
      message: t(k.workspace.confirmRemoveMessage),
      confirmLabel: t(k.workspace.remove),
      onConfirm: () => handleRemoveMember(pendingAction.user_id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={t(k.workspace.workspaceSettings)} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + design.spacing.lg },
        ]}
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
          onRemoveMember={(member) =>
            setPendingAction({ kind: 'remove', user_id: member.user_id, name: member.name })
          }
        />

        {isOwner && (
          <>
            <WorkspaceInvitesSection invites={invites} onRevoke={handleRevoke} />
            <Button
              variant="primary"
              onPress={() => setShowInviteSheet(true)}
              style={styles.inviteButton}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.black} />
              <Text style={styles.inviteButtonText}>{t(k.workspace.inviteMember)}</Text>
            </Button>
          </>
        )}

        {!isPersonal && (
          <View style={styles.footer}>
            {isOwner ? (
              <Button
                onPress={() => setPendingAction({ kind: 'delete' })}
                style={styles.dangerButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.white} />
                <Text style={styles.dangerButtonText}>{t(k.workspace.deleteWorkspace)}</Text>
              </Button>
            ) : (
              <Button
                variant="outline"
                onPress={() => setPendingAction({ kind: 'leave' })}
                style={styles.leaveButton}
              >
                <Ionicons name="exit-outline" size={20} color={colors.expense} />
                <Text style={styles.leaveButtonText}>{t(k.workspace.leaveWorkspace)}</Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      <WorkspaceInviteSheet
        visible={showInviteSheet}
        workspaceId={workspace?.id}
        onDismiss={() => setShowInviteSheet(false)}
        onError={(title, message) => setAlert({ title, message })}
      />

      <Alert
        visible={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message}
        actions={
          confirmAction
            ? [
                {
                  label: t(k.common.cancel),
                  variant: 'outline',
                  onPress: () => setPendingAction(null),
                },
                {
                  label: confirmAction.confirmLabel,
                  variant: 'dark',
                  onPress: confirmAction.onConfirm,
                },
              ]
            : undefined
        }
        onDismiss={() => setPendingAction(null)}
      />

      <Alert
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message}
        onDismiss={() => setAlert(null)}
      />
    </View>
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
