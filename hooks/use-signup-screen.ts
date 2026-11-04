import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useAppleSignInAvailable, useSignInWithApple, useSignUpWithEmail } from '@/hooks/use-auth';
import { showAlertDialog } from '@/lib/alert-dialog';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';

/**
 * Screen hook for Signup: the email/new-password form, Sign up with Apple (iOS) and the switch
 * back to Sign In. Cancelling the Apple sheet is silent; failures alert.
 */
export function useSignupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const signUpWithEmail = useSignUpWithEmail();
  const signInWithApple = useSignInWithApple();
  const isAppleAvailable = useAppleSignInAvailable();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = signUpWithEmail.isPending || signInWithApple.isPending;

  function signUp() {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) {
      showAlertDialog(t(k.signup.missingFields), t(k.signup.missingFieldsMessage));
      return;
    }
    signUpWithEmail.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          showAlertDialog(t(k.signup.checkEmail), t(k.signup.checkEmailMessage));
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

  // Apple has one flow for new and returning accounts: it signs up on the first use.
  function signUpWithApple() {
    if (isSubmitting) return;
    signInWithApple.mutate(undefined, {
      onError: (error) => {
        showAlertDialog(
          t(k.signup.signUpFailed),
          getErrorMessage(error, t(k.common.unexpectedError)),
        );
      },
    });
  }

  return {
    setEmail,
    setPassword,
    isSubmitting,
    isSigningUp: signUpWithEmail.isPending,
    signUp,
    isAppleAvailable,
    signUpWithApple,
    openSignIn: () => router.back(),
  };
}
