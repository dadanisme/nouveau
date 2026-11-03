import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useSession, useSignOut, useUserProfile } from '@/hooks/use-auth';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { k } from '@/locales/keys';

/** Screen hook for Settings: profile, active workspace, language and sign-out. */
export function useSettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const { session } = useSession();
  const { data: user, error: userError } = useUserProfile(session?.user.id);
  const signOut = useSignOut();
  const { currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const profileImage: string | null =
    user?.profile_image ?? session?.user.user_metadata?.avatar_url ?? null;

  const languageOptions = LANGUAGE_OPTIONS.map((option) => ({
    value: option.locale,
    label: t(option.labelKey),
  }));

  function confirmSignOut() {
    Alert.alert(t(k.settings.signOutConfirmTitle), t(k.settings.signOutConfirmMessage), [
      { text: t(k.common.cancel), style: 'cancel' },
      {
        text: t(k.settings.signOut),
        style: 'destructive',
        onPress: () =>
          signOut.mutate(undefined, {
            onError: (error) => {
              Alert.alert(
                t(k.settings.signOutFailed),
                error instanceof Error ? error.message : t(k.common.unexpectedError),
              );
            },
          }),
      },
    ]);
  }

  return {
    profile: {
      name: displayName || t(k.settings.unknown),
      email: email || t(k.settings.noEmail),
      imageUri: profileImage,
    },
    hasProfileError: Boolean(userError),
    workspaceName: currentWorkspace?.name,
    pendingInviteCount: pendingInvites.length,
    locale,
    setLocale,
    languageOptions,
    signOutPending: signOut.isPending,
    confirmSignOut,
    openWorkspaceSwitcher: () => router.push('/workspace-switcher'),
    openWorkspaces: () => router.push('/workspaces'),
    openCategories: () => router.push('/categories'),
    openSubscriptions: () => router.push('/subscriptions'),
  };
}
