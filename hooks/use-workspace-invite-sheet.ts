import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useCreateInvite } from '@/hooks/use-workspace-invites';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/** A copied invite token is cleared from the clipboard after this long, if it's still there. */
const CLIPBOARD_CLEAR_DELAY_MS = 60_000;

export interface WorkspaceInviteSheetParams {
  workspaceId: string;
}

/**
 * Screen hook for the `workspace-invite` sheet route: invites an email address to the workspace,
 * then shows the invite token to copy. A failed invite shows a native alert.
 */
export function useWorkspaceInviteSheet() {
  const router = useRouter();
  const { workspaceId } = useLocalSearchParams<Partial<WorkspaceInviteSheetParams>>();
  const createInvite = useCreateInvite();
  const [email, setEmail] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const canSubmit = !!workspaceId && !!email.trim() && !createInvite.isPending;

  function submit() {
    const trimmed = email.trim();
    if (!workspaceId || !trimmed || createInvite.isPending) return;
    createInvite.mutate(
      { workspace_id: workspaceId, email: trimmed },
      {
        onSuccess: (invite) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setEmail('');
          if (invite?.token) setCreatedToken(invite.token);
        },
        onError: (error) => {
          Alert.alert(
            i18n.t(k.workspace.failedToInvite),
            error instanceof Error ? error.message : i18n.t(k.common.unexpectedError),
          );
        },
      },
    );
  }

  async function copyToken() {
    if (!createdToken) return;
    const token = createdToken;
    await Clipboard.setStringAsync(token);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      if ((await Clipboard.getStringAsync()) === token) {
        await Clipboard.setStringAsync('');
      }
    }, CLIPBOARD_CLEAR_DELAY_MS);
  }

  return {
    email,
    setEmail,
    createdToken,
    canSubmit,
    isPending: createInvite.isPending,
    submit,
    copyToken,
    close: () => router.back(),
  };
}
