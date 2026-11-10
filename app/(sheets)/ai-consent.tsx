import { useHeaderHeight } from '@react-navigation/elements';

import { AiConsentPrompt } from '@/components/ai-consent-prompt';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { useAiConsentSheet } from '@/hooks/use-ai-consent-sheet';
import { isIOSVersionAtLeast } from '@/utils/platform';

/**
 * iOS 26+: the sheet's content extends under its header, and react-native-screens fits a
 * `fitToContents` sheet to the content's frame alone, so the fitted prompt is moved below the
 * header by its height (`fitTopInset`). iOS 17-18 lay the content out below the header and add
 * its height to the sheet themselves.
 */
const CONTENT_UNDER_HEADER = isIOSVersionAtLeast(26);

/**
 * The AI consent prompt sheet (#122), opened at the first AI use (auto-categorize, Scan Receipt)
 * and from Settings' AI Processing toggle: what is sent to OpenRouter (Google Gemini), the Privacy
 * Policy, Allow and Not Now. iOS also has a leading Close in its header; Android's form sheet is
 * headerless, so the prompt's own heading and buttons are all. The sheet fits the prompt
 * (`fitToContents`, so nothing is below the fold when Allow is tapped), and is full height with a
 * scrolling prompt at accessibility text sizes (both set in the root layout).
 */
export default function AiConsentSheet() {
  const prompt = useAiConsentSheet();
  const headerHeight = useHeaderHeight();

  return (
    <>
      <SheetCloseToolbar onPress={prompt.close} />
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
        fitContent
        fitTopInset={CONTENT_UNDER_HEADER ? headerHeight : 0}
      />
    </>
  );
}
