import { SignInPrompt } from '@/components/sign-in-prompt';
import { useSignInPromptSheet } from '@/hooks/use-sign-in-prompt-sheet';

/**
 * The sign-in prompt pushed inside the Edit Transaction sheet (iOS), with the system Back instead
 * of the root sheet's Close: one sheet at a time. Same content as `(sheets)/sign-in-prompt`.
 */
export default function EditorSignInPrompt() {
  const prompt = useSignInPromptSheet();

  return (
    <SignInPrompt
      symbol={prompt.symbol}
      title={prompt.title}
      body={prompt.body}
      signInLabel={prompt.signInLabel}
      notNowLabel={prompt.notNowLabel}
      onSignIn={prompt.signIn}
      onNotNow={prompt.notNow}
    />
  );
}
