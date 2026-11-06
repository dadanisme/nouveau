import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';

import { useGuestSession } from '@/hooks/use-auth';
import i18n from '@/lib/i18n';
import { goBackOrHome } from '@/lib/navigation';
import { emitSheetResult } from '@/lib/sheet-result';
import { k } from '@/locales/keys';
import {
  getSignInPromptBodyKey,
  getSignInPromptContent,
  parseSignInFeature,
} from '@/utils/sign-in-prompt';

export interface SignInPromptSheetParams {
  /** A `SignInFeature`; anything else shows the generic wording. */
  feature: string;
  requestId: string;
}

/**
 * Screen hook for the sign-in prompt (`(sheets)/sign-in-prompt`, and `add-transaction/sign-in-prompt`
 * pushed inside the editor on iOS): the feature's title and symbol, Sign In and Not Now. Both hand
 * the choice to the presenter (`useSignInPrompt`), which closes the prompt and goes on; only the
 * first tap counts. With no presenter to answer, the prompt closes itself (and Sign In pushes
 * Login). The iOS Close and a swipe-down just close it.
 */
export function useSignInPromptSheet() {
  const params = useLocalSearchParams<Partial<SignInPromptSheetParams>>();
  const { titleKey, symbol } = getSignInPromptContent(parseSignInFeature(params.feature));
  const { guestId } = useGuestSession();
  const respondedRef = useRef(false);

  function respond(choice: 'signIn' | 'notNow') {
    if (respondedRef.current) return;
    respondedRef.current = true;
    if (params.requestId) {
      emitSheetResult('sign-in-prompt', params.requestId, { choice });
      return;
    }
    goBackOrHome();
    if (choice === 'signIn') router.push('/login');
  }

  return {
    title: i18n.t(titleKey),
    body: i18n.t(getSignInPromptBodyKey(!!guestId)),
    symbol,
    signInLabel: i18n.t(k.signInPrompt.signIn),
    notNowLabel: i18n.t(k.signInPrompt.notNow),
    signIn: () => respond('signIn'),
    notNow: () => respond('notNow'),
    close: () => goBackOrHome(),
  };
}
