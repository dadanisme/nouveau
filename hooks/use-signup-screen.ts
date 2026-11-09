import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import {
  useAppleSignInAvailable,
  useSignInWithApple,
  useSignInWithGoogle,
  useSignUpWithEmail,
} from '@/hooks/use-auth';
import { showAlertDialog } from '@/lib/alert-dialog';
import { openLegalPage } from '@/lib/legal';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';

/**
 * Screen hook for Signup: the email/new-password form, Sign up with Apple (iOS) and Google, and the
 * switch back to Sign In, and the Terms of Use / Privacy Policy links under them (#81). Cancelling a
 * provider sheet is silent; failures alert.
 */
export function useSignupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const signUpWithEmail = useSignUpWithEmail();
  const signInWithApple = useSignInWithApple();
  const signInWithGoogle = useSignInWithGoogle();
  const isAppleAvailable = useAppleSignInAvailable();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting =
    signUpWithEmail.isPending || signInWithApple.isPending || signInWithGoogle.isPending;

  function signUp() {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) {
      showAlertDialog(t(k.signup.missingFields), t(k.signup.missingFieldsMessage));
      return;
    }
    signUpWithEmail.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (result) => {
          // With a session the account is already signed in: the handover and the new-account
          // currency step take over, so there's nothing to tell them (#120).
          if (result === 'confirmEmail') {
            showAlertDialog(t(k.signup.checkEmail), t(k.signup.checkEmailMessage));
          }
        },
        onError: (error) => {
          showAlertDialog(
            t(k.signup.signUpFailed),
            getErrorMessage(error, t(k.common.unexpectedError)),
          );
        },
      },
    );
  }

  function showSignUpError(error: unknown) {
    showAlertDialog(t(k.signup.signUpFailed), getErrorMessage(error, t(k.common.unexpectedError)));
  }

  // Apple and Google have one flow for new and returning accounts: they sign up on the first use.
  function signUpWithApple() {
    if (isSubmitting) return;
    signInWithApple.mutate(undefined, { onError: showSignUpError });
  }

  function signUpWithGoogle() {
    if (isSubmitting) return;
    signInWithGoogle.mutate(undefined, { onError: showSignUpError });
  }

  return {
    setEmail,
    setPassword,
    isSubmitting,
    isSigningUp: signUpWithEmail.isPending,
    signUp,
    isAppleAvailable,
    signUpWithApple,
    signUpWithGoogle,
    openSignIn: () => router.back(),
    openTerms: () => openLegalPage('terms'),
    openPrivacy: () => openLegalPage('privacy'),
  };
}
