import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceInviteSheet } from '@/hooks/use-workspace-invite-sheet';
import { k } from '@/locales/keys';

/**
 * Workspace invite sheet (fits its content). Param: `workspaceId`. The native sheet moves up with
 * the keyboard on both platforms. The form is legacy markup until the workspace screens are
 * rebuilt natively.
 */
export default function WorkspaceInviteSheet() {
  const { t } = useLanguage();
  const invite = useWorkspaceInviteSheet();

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{t(k.workspace.inviteByEmail)}</Text>
      {invite.createdToken ? (
        <View style={styles.tokenBlock}>
          <Text style={styles.tokenLabel}>{t(k.workspace.inviteCreated)}</Text>
          <Text style={styles.tokenHint}>{t(k.workspace.inviteShareHint)}</Text>
          <Card style={styles.tokenCard}>
            <Text style={styles.tokenValue} selectable>
              {invite.createdToken}
            </Text>
          </Card>
          <Button variant="primary" onPress={invite.copyToken}>
            <Ionicons name="copy-outline" size={20} color={colors.black} />
            <Text style={styles.buttonText}>{t(k.workspace.copyToken)}</Text>
          </Button>
          <Button variant="outline" onPress={invite.close}>
            <Text style={styles.buttonText}>{t(k.common.done)}</Text>
          </Button>
        </View>
      ) : (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t(k.workspace.emailAddress)}</Text>
          <Card style={styles.inputCard}>
            <TextInput
              value={invite.email}
              onChangeText={invite.setEmail}
              placeholder={t(k.workspace.emailPlaceholder)}
              placeholderTextColor={colors.gray[400]}
              style={styles.input}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={invite.submit}
            />
          </Card>
          <Button variant="primary" onPress={invite.submit} disabled={!invite.canSubmit}>
            <Text style={styles.buttonText}>
              {invite.isPending ? t(k.common.pleaseWait) : t(k.workspace.sendInvite)}
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.xl,
    paddingBottom: design.spacing.xl,
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
});
