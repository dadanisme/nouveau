import { useHeaderHeight } from '@react-navigation/elements';
import { View } from 'react-native';

import { AiConsentPrompt } from '@/components/ai-consent-prompt';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';
import { useAiConsentSheet } from '@/hooks/use-ai-consent-sheet';
import { isIOSVersionAtLeast } from '@/utils/platform';

/**
 * iOS 26+: react-native-screens sizes a `fitToContents` sheet to its content without the height of
 * a sheet's own header (it assumes the content extends under the bar), so the prompt came out one
 * header too short and Not Now sat below the sheet. Padding the bottom by the header height gives
 * the sheet that height back; the padding itself falls below the sheet's edge. iOS 17-18 add the
 * header height themselves.
 */
const PAD_FOR_HEADER = isIOSVersionAtLeast(26);

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
  const isLargeText = useIsAccessibilityTextSize();
  const isFitted = PAD_FOR_HEADER && !isLargeText;

  const content = (
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
    />
  );

  return (
    <>
      <SheetCloseToolbar onPress={prompt.close} />
      {isFitted ? <View style={{ paddingBottom: headerHeight }}>{content}</View> : content}
    </>
  );
}
