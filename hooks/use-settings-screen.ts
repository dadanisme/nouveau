import { useRouter } from 'expo-router';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useEraseGuestData, useIsGuest, useSignOut } from '@/hooks/use-auth';
import { useProfileSummary } from '@/hooks/use-profile-summary';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { usePremium } from '@/hooks/use-premium';
import { useSignInPrompt } from '@/hooks/use-sign-in-prompt';
import { showAlertDialog } from '@/lib/alert-dialog';
import { confirmDestructive } from '@/lib/confirm-destructive';
import { openLegalPage } from '@/lib/legal';
import { k } from '@/locales/keys';
import { getPremiumRowValueKey } from '@/utils/premium';

/**
 * Screen hook for Settings: Sign In for a guest (#100, pushes Login), the profile row (opens
 * Profile), active workspace, language, View Introduction (the value pages again), the Terms of
 * Use and Privacy Policy (#81, in the in-app browser), and sign-out,
 * which a guest has as Erase Data instead (there's no account to sign out of). A guest has no
 * profile, so the screen hides it; their Premium row opens the sign-in prompt (#79).
 */
export function useSettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const profile = useProfileSummary();
  const signOut = useSignOut();
  const eraseGuestData = useEraseGuestData();
  const isGuest = useIsGuest();
  const { currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();
  const premium = usePremium();
  const { requireAccount } = useSignInPrompt();

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

  function confirmEraseData() {
    confirmDestructive({
      // The iOS sheet shows the message over its red button; the Android dialog asks first.
      dialogTitle: t(k.settings.eraseDataPrompt),
      message: t(k.settings.eraseDataMessage),
      confirmLabel: t(k.settings.eraseDataConfirm),
      onConfirm: () =>
        // Erased, the guest is gone and the guards return to Welcome (useAuthRoutes).
        eraseGuestData.mutate(undefined, {
          onError: (error) => {
            showAlertDialog(
              t(k.settings.eraseDataFailed),
              error instanceof Error ? error.message : t(k.common.unexpectedError),
            );
          },
        }),
    });
  }

  return {
    isGuest,
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
    erasePending: eraseGuestData.isPending,
    confirmEraseData,
    openWorkspaceSwitcher: () => router.push('/workspace-switcher'),
    openWorkspaces: () => router.push('/workspaces'),
    openCategories: () => router.push('/categories'),
    // Free / Trial / Active, once known; a guest's row has no value.
    premiumValue:
      isGuest || premium.isLoading || premium.hasError
        ? undefined
        : t(getPremiumRowValueKey(premium.status)),
    openPremium: () => requireAccount('premium', () => router.push('/premium')),
    openIntroduction: () => router.push('/introduction'),
    openTerms: () => openLegalPage('terms'),
    openPrivacy: () => openLegalPage('privacy'),
  };
}
