import { useRouter } from 'expo-router';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useGuestSession, useSession, useSignOut } from '@/hooks/use-auth';
import { useProfileSummary } from '@/hooks/use-profile-summary';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { showAlertDialog } from '@/lib/alert-dialog';
import { k } from '@/locales/keys';

/**
 * Screen hook for Settings: Sign In for a guest (#100, pushes Login), the profile row (opens
 * Profile), active workspace, language, View Introduction (the value pages again), sign-out.
 */
export function useSettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const profile = useProfileSummary();
  const signOut = useSignOut();
  const { session } = useSession();
  const { guestId } = useGuestSession();
  const { currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();

  const languageOptions = LANGUAGE_OPTIONS.map((option) => ({
    value: option.locale,
    label: t(option.labelKey),
  }));

  function confirmSignOut() {
    showAlertDialog(t(k.settings.signOutConfirmTitle), t(k.settings.signOutConfirmMessage), [
      { text: t(k.common.cancel), style: 'cancel' },
      {
        // Default style: signing out is what the person chose, and it destroys no data (HIG alerts).
        text: t(k.settings.signOut),
        onPress: () =>
          signOut.mutate(undefined, {
            onError: (error) => {
              showAlertDialog(
                t(k.settings.signOutFailed),
                error instanceof Error ? error.message : t(k.common.unexpectedError),
              );
            },
          }),
      },
    ]);
  }

  return {
    isGuest: !session && !!guestId,
    openSignIn: () => router.push('/login'),
    profile: profile.header,
    hasProfileError: profile.hasError,
    openProfile: () => router.push('/profile'),
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
    openIntroduction: () => router.push('/introduction'),
  };
}
