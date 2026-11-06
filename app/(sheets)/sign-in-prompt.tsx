import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { useSignInPromptSheet } from '@/hooks/use-sign-in-prompt-sheet';

/**
 * The sign-in prompt sheet (#100), opened when a guest taps an account-only feature (`?feature=`
 * names it): why it needs an account, Sign In and Not Now. iOS also has a leading Close in its
 * header; Android's form sheet is headerless, so the prompt's own heading and buttons are all.
 */
export default function SignInPromptSheet() {
  const prompt = useSignInPromptSheet();

  return (
    <>
      <SheetCloseToolbar onPress={prompt.close} />
      <SignInPrompt
        symbol={prompt.symbol}
        title={prompt.title}
        body={prompt.body}
        signInLabel={prompt.signInLabel}
        notNowLabel={prompt.notNowLabel}
        onSignIn={prompt.signIn}
        onNotNow={prompt.notNow}
      />
    </>
  );
}
