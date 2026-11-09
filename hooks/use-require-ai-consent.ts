import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Platform } from 'react-native';

import { useAiConsent, useSetAiConsent } from '@/hooks/use-ai-consent';
import { useSheetResult } from '@/hooks/use-sheet-result';
import { showAlertDialog } from '@/lib/alert-dialog';
import i18n from '@/lib/i18n';
import { dismissKeyboard } from '@/lib/keyboard';
import { goBackOrHome } from '@/lib/navigation';
import { k } from '@/locales/keys';
import {
  getConsentRequiredAction,
  getConsentToStore,
  getScanDecision,
  type AiConsentSource,
} from '@/utils/ai-consent';
import { getErrorMessage } from '@/utils/error';

export interface AiConsentPromptOptions {
  /**
   * The presenter is the Add/Edit Transaction sheet: on iOS the prompt pushes inside its Stack
   * (one sheet at a time), on Android it's the root sheet over the full-screen modal.
   */
  inEditor?: boolean;
}

interface HeldRequest {
  source: AiConsentSource;
  /** Runs once Allow has been stored. */
  then?: () => void;
}

/**
 * For a screen with AI features (#122), like `useRequirePremium`, which it follows: the one-time
 * consent before anything is sent to OpenRouter. `ask(source, then)` opens the prompt
 * (`(sheets)/ai-consent`); its choice comes back here, which closes it, stores what the choice
 * means for `source` (`getConsentToStore`) and, after Allow is saved, runs `then`.
 * `requireAiConsent(action)` is the Scan Receipt gate: it runs `action` when consent is granted
 * and asks otherwise. `recheck` handles a server `ai_consent_required` refusal.
 */
export function useRequireAiConsent({ inEditor = false }: AiConsentPromptOptions = {}) {
  const router = useRouter();
  const aiConsent = useAiConsent();
  const setConsent = useSetAiConsent();
  const held = useRef<HeldRequest | null>(null);

  const requestId = useSheetResult('ai-consent', ({ choice }) => {
    const request = held.current;
    held.current = null;
    goBackOrHome();
    if (!request) return;
    const value = getConsentToStore(request.source, choice);
    if (value === 'unchanged') return;
    save(value, choice === 'allow' ? request.then : undefined);
  });

  function save(value: 'granted' | 'declined', then?: () => void) {
    setConsent.mutate(value, {
      onSuccess: () => then?.(),
      onError: (error) =>
        showAlertDialog(
          i18n.t(k.aiConsent.saveFailed),
          getErrorMessage(error, i18n.t(k.common.unexpectedError)),
        ),
    });
  }

  /**
   * Opens the prompt for `source`. The keyboard closes first (a sheet shown while a SwiftUI
   * field's keyboard is up sits under it), and the push waits for that: it also lands after a
   * paywall that closes itself in the same tick it ran the action that asks here.
   */
  async function ask(source: AiConsentSource, then?: () => void) {
    held.current = { source, then };
    await dismissKeyboard();
    router.push({
      pathname: inEditor && Platform.OS === 'ios' ? '/add-transaction/ai-consent' : '/ai-consent',
      params: { requestId },
    });
  }

  /**
   * Scan Receipt's gate, after the account and Premium ones: a tap is always deliberate, so it asks
   * unless consent is granted (a stored `declined` included). Not yet loaded, it's read first.
   */
  async function requireAiConsent(action: () => void) {
    const consent = aiConsent.isKnown ? aiConsent.consent : await aiConsent.refresh();
    if (getScanDecision(consent) === 'scan') return action();
    void ask('scanReceipt', action);
  }

  /**
   * After the server answered an AI call with `ai_consent_required` (consent changed on another
   * device): reads the stored answer again, and asks once more when the rule for `source` says so
   * (`getConsentRequiredAction`). Resolves whether it asked.
   */
  async function recheck(
    source: AiConsentSource,
    retry: () => void,
    { hasAsked = false }: { hasAsked?: boolean } = {},
  ): Promise<boolean> {
    const refreshed = await aiConsent.refresh();
    if (getConsentRequiredAction({ source, refreshed, hasAsked }) !== 'ask') return false;
    void ask(source, retry);
    return true;
  }

  return {
    consent: aiConsent.consent,
    isKnown: aiConsent.isKnown,
    isSaving: setConsent.isPending,
    ask,
    /** Stores an answer directly (Settings' toggle turned off). */
    save,
    requireAiConsent,
    recheck,
  };
}
