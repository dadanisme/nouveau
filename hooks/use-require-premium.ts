import { useRouter } from 'expo-router';
import { useRef } from 'react';

import { usePremium } from '@/hooks/use-premium';
import { useSheetResult } from '@/hooks/use-sheet-result';
import { useSignInPrompt, type SignInPromptOptions } from '@/hooks/use-sign-in-prompt';
import type { PremiumFeature } from '@/utils/premium';
import type { SignInFeature } from '@/utils/sign-in-prompt';

/** The sign-in prompt's wording for a Premium feature a guest taps. */
const SIGN_IN_FEATURE: Record<PremiumFeature, SignInFeature> = {
  scanReceipt: 'scanReceipt',
  proofs: 'proofs',
  autoCategorize: 'premium',
};

/**
 * For a screen with Premium features (#79), like `useSignInPrompt`: `requirePremium(feature,
 * action)` opens the sign-in prompt without a session (options go to it), the paywall
 * (`(sheets)/paywall`, `source=feature`) for a free account, and otherwise runs `action`. Buying
 * or restoring on that paywall closes it and runs the held action, so the feature just works.
 * While the status is still loading the action runs: the server checks Premium itself, and its
 * `premium_required` 403 comes back through `openPaywall`.
 */
export function useRequirePremium(options: SignInPromptOptions = {}) {
  const router = useRouter();
  const { requireAccount } = useSignInPrompt(options);
  const premium = usePremium();
  const heldAction = useRef<(() => void) | null>(null);

  const requestId = useSheetResult('paywall', ({ purchased }) => {
    const action = heldAction.current;
    heldAction.current = null;
    if (purchased) action?.();
  });

  /** The paywall for `feature`; `then` runs once Premium is bought or restored there. */
  function openPaywall(feature: PremiumFeature, then?: () => void) {
    heldAction.current = then ?? null;
    router.push({ pathname: '/paywall', params: { source: 'feature', feature, requestId } });
  }

  function requirePremium(feature: PremiumFeature, action: () => void) {
    requireAccount(SIGN_IN_FEATURE[feature], () => {
      if (premium.isActive || premium.isLoading) return action();
      openPaywall(feature, action);
    });
  }

  return { requirePremium, openPaywall, isPremium: premium.isActive };
}
