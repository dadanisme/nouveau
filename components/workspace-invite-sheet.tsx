import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useCreateInvite } from '@/hooks/use-workspace-invites';
import { k } from '@/locales/keys';

const CLIPBOARD_CLEAR_DELAY_MS = 60_000;

interface WorkspaceInviteSheetProps {
  visible: boolean;
  workspaceId: string | undefined;
  onDismiss: () => void;
  onError: (title: string, message?: string) => void;
}

export function WorkspaceInviteSheet({
  visible,
  workspaceId,
  onDismiss,
  onError,
}: WorkspaceInviteSheetProps) {
  const { t } = useLanguage();
  const createInvite = useCreateInvite();
  const [email, setEmail] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function handleSubmit() {
    if (!workspaceId) return;
    const trimmed = email.trim();
    if (!trimmed) return;
    createInvite.mutate(
      { workspace_id: workspaceId, email: trimmed },
      {
        onSuccess: (invite) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setEmail('');
          if (invite?.token) setCreatedToken(invite.token);
        },
        onError: (error) => {
          onError(
            t(k.workspace.failedToInvite),
            error instanceof Error ? error.message : t(k.common.unexpectedError),
          );
        },
      },
    );
  }

  async function handleCopy() {
    if (!createdToken) return;
    await Clipboard.setStringAsync(createdToken);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = createdToken;
    setTimeout(async () => {
      const current = await Clipboard.getStringAsync();
      if (current === token) {
        await Clipboard.setStringAsync('');
      }
    }, CLIPBOARD_CLEAR_DELAY_MS);
  }

  function handleDismiss() {
    onDismiss();
    setCreatedToken(null);
    setEmail('');
  }

  return (
    <BottomSheet visible={visible} onDismiss={handleDismiss}>
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t(k.workspace.inviteByEmail)}</Text>
        {createdToken ? (
          <View style={styles.tokenBlock}>
            <Text style={styles.tokenLabel}>{t(k.workspace.inviteCreated)}</Text>
            <Text style={styles.tokenHint}>{t(k.workspace.inviteShareHint)}</Text>
            <Card style={styles.tokenCard}>
              <Text style={styles.tokenValue} selectable>
                {createdToken}
              </Text>
            </Card>
            <Button variant="primary" onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color={colors.black} />
              <Text style={styles.buttonText}>{t(k.workspace.copyToken)}</Text>
            </Button>
            <Button variant="outline" onPress={handleDismiss}>
              <Text style={styles.buttonText}>{t(k.common.done)}</Text>
            </Button>
          </View>
        ) : (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t(k.workspace.emailAddress)}</Text>
            <Card style={styles.inputCard}>
              <BottomSheetTextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t(k.workspace.emailPlaceholder)}
                placeholderTextColor={colors.gray[400]}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Card>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={createInvite.isPending || !email.trim()}
            >
              <Text style={styles.buttonText}>
                {createInvite.isPending ? t(k.common.pleaseWait) : t(k.workspace.sendInvite)}
              </Text>
            </Button>
          </View>
        )}
        <View style={styles.bottomPad} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.sm,
    gap: design.spacing.md,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
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
  tokenBlock: {
    gap: design.spacing.md,
  },
  tokenLabel: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.gray[900],
  },
  tokenHint: {
    fontSize: design.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[600],
    lineHeight: 20,
  },
  tokenCard: {
    backgroundColor: colors.gray[50],
  },
  tokenValue: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[900],
    fontFamily: 'monospace',
  },
  buttonText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
  bottomPad: {
    height: design.spacing.lg,
  },
});
