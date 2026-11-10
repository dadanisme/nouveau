import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';

import { useLanguage } from '@/contexts/language';
import { openLegalPage } from '@/lib/legal';
import { goBackOrHome } from '@/lib/navigation';
import { emitSheetResult } from '@/lib/sheet-result';
import { k } from '@/locales/keys';
import { AI_CONSENT_SYMBOL, type AiConsentChoice } from '@/utils/ai-consent';

export interface AiConsentSheetParams {
  requestId: string;
}

/**
 * Screen hook for the AI consent prompt (#122, `(sheets)/ai-consent`, and
 * `add-transaction/ai-consent` pushed inside the editor on iOS): what is sent and to whom, the
 * Privacy Policy, Allow and Not Now. Both hand the choice to the presenter
 * (`useRequireAiConsent`), which closes the prompt and stores it; only the first tap counts. With
 * no presenter to answer, it just closes. The iOS Close and a swipe-down close it with no answer.
 */
export function useAiConsentSheet() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<Partial<AiConsentSheetParams>>();
  const respondedRef = useRef(false);

  function respond(choice: AiConsentChoice) {
    if (respondedRef.current) return;
    respondedRef.current = true;
    if (params.requestId) {
      emitSheetResult('ai-consent', params.requestId, { choice });
      return;
    }
    goBackOrHome();
  }

  return {
    symbol: AI_CONSENT_SYMBOL,
    title: t(k.aiConsent.title),
    body: t(k.aiConsent.body),
    privacyLabel: t(k.legal.privacy),
    allowLabel: t(k.aiConsent.allow),
    notNowLabel: t(k.aiConsent.notNow),
    openPrivacy: () => openLegalPage('privacy'),
    allow: () => respond('allow'),
    notNow: () => respond('notNow'),
    close: () => goBackOrHome(),
  };
}
