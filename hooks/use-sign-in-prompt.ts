import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

import { useSession } from '@/hooks/use-auth';
import { useSheetResult } from '@/hooks/use-sheet-result';
import { goBackOrHome } from '@/lib/navigation';
import type { SignInFeature } from '@/utils/sign-in-prompt';

export interface SignInPromptOptions {
  /**
   * The presenter is the Add/Edit Transaction sheet: on iOS the prompt pushes inside its Stack (one
   * sheet at a time), on Android it's the root sheet over the full-screen modal.
   */
  inEditor?: boolean;
  /** Sign In, once the prompt has closed. Defaults to pushing Login (Settings' Sign In). */
  onSignIn?: () => void;
  /** Not Now. Defaults to closing the prompt. */
  onNotNow?: () => void;
}

/**
 * For a screen with account-only features (#100): `requireAccount(feature, action)` runs `action`
 * with a session, and otherwise (a guest, or nobody signed in on a share intent) opens the sign-in
 * prompt for `feature`, so the feature stays visible and only the tap is held. Sign In closes the
 * prompt and pushes Login, where signing in uploads the guest's device data.
 */
export function useSignInPrompt({
  inEditor = false,
  onSignIn,
  onNotNow,
}: SignInPromptOptions = {}) {
  const router = useRouter();
  const { session, isLoading } = useSession();

  const requestId = useSheetResult('sign-in-prompt', ({ choice }) => {
    if (choice === 'notNow') {
      if (onNotNow) onNotNow();
      else goBackOrHome();
      return;
    }
    if (onSignIn) {
      onSignIn();
      return;
    }
    // Closed first, so Login pushes over the screen that opened the prompt.
    goBackOrHome();
    router.push('/login');
  });

  function open(feature: SignInFeature) {
    router.push({
      pathname:
        inEditor && Platform.OS === 'ios' ? '/add-transaction/sign-in-prompt' : '/sign-in-prompt',
      params: { feature, requestId },
    });
  }

  function requireAccount(feature: SignInFeature, action: () => void) {
    if (session) return action();
    // The stored session is read at launch; a tap before that is dropped, not misread as a guest's.
    if (isLoading) return;
    open(feature);
  }

  return { requireAccount };
}
