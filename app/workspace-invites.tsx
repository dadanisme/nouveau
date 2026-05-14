import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import {
  useAcceptInvite,
  useMyPendingInvites,
  type WorkspaceInviteWithWorkspace,
} from '@/hooks/use-workspace-invites';
import { formatShortDate } from '@/utils/date';
import { k } from '@/locales/keys';

export default function WorkspaceInvitesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const { data: invites = [], isLoading } = useMyPendingInvites();
  const acceptInvite = useAcceptInvite();
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  function handleAccept(invite: WorkspaceInviteWithWorkspace) {
    setAcceptingId(invite.id);
    acceptInvite.mutate(invite.token, {
      onSuccess: async (newWorkspaceId) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (newWorkspaceId) await switchWorkspace(newWorkspaceId);
        setAcceptingId(null);
        router.back();
      },
      onError: (error) => {
        setAcceptingId(null);
        setAlert({
          title: t(k.workspace.failedToAccept),
          message: error instanceof Error ? error.message : t(k.common.unexpectedError),
        });
      },
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={t(k.workspace.pendingInvites)} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        {!isLoading && invites.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>{t(k.workspace.noInvites)}</Text>
          </View>
        )}

        {invites.map((invite) => (
          <Card key={invite.id} style={styles.inviteCard}>
            <View style={styles.inviteHead}>
              <View style={styles.inviteIcon}>
                <Ionicons name="people-outline" size={22} color={colors.gray[700]} />
              </View>
              <View style={styles.inviteText}>
                <Text style={styles.inviteName}>
                  {invite.workspaces?.name ?? t(k.workspace.shared)}
                </Text>
                <Text style={styles.inviteMeta}>
                  {t(k.workspace.expiresAt, { date: formatShortDate(invite.expires_at) })}
                </Text>
              </View>
            </View>
            <Button
              variant="primary"
              onPress={() => handleAccept(invite)}
              disabled={acceptingId !== null}
              style={styles.acceptButton}
            >
              <Text style={styles.acceptText}>
                {acceptingId === invite.id ? t(k.workspace.accepting) : t(k.workspace.accept)}
              </Text>
            </Button>
          </Card>
        ))}
      </ScrollView>

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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.xl * 2,
    gap: design.spacing.sm + 4,
  },
  emptyText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[400],
  },
  inviteCard: {
    gap: design.spacing.md,
  },
  inviteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteText: {
    flex: 1,
    gap: 2,
  },
  inviteName: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.gray[900],
  },
  inviteMeta: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  acceptButton: {
    paddingVertical: design.spacing.sm + 2,
  },
  acceptText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
});
