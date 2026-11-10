import { AiConsentPrompt } from '@/components/ai-consent-prompt';
import { useAiConsentSheet } from '@/hooks/use-ai-consent-sheet';

/**
 * The AI consent prompt pushed inside the Add Transaction sheet (iOS, #122) when auto-categorize
 * first runs, with the system Back instead of the root sheet's Close: one sheet at a time. Same
 * content as `(sheets)/ai-consent`.
 */
export default function EditorAiConsentPrompt() {
  const prompt = useAiConsentSheet();

  return (
    <AiConsentPrompt
      symbol={prompt.symbol}
      title={prompt.title}
      body={prompt.body}
      privacyLabel={prompt.privacyLabel}
      allowLabel={prompt.allowLabel}
      notNowLabel={prompt.notNowLabel}
      onOpenPrivacy={prompt.openPrivacy}
      onAllow={prompt.allow}
      onNotNow={prompt.notNow}
    />
  );
}
