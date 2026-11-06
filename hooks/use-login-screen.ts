import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import {
  useAppleSignInAvailable,
  useSignInWithApple,
  useSignInWithEmail,
  useSignInWithGoogle,
} from '@/hooks/use-auth';
import { showAlertDialog } from '@/lib/alert-dialog';
import { k } from '@/locales/keys';
import { getErrorCode, getErrorMessage } from '@/utils/error';

/**
 * Screen hook for Login: the email/password form, Apple (iOS) and Google sign-in, and the switch
 * to Sign Up. Guest mode starts from Welcome's Get Started instead (#78). Cancelling a provider sheet is silent; failures alert.
 */
export function useLoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const signInWithEmail = useSignInWithEmail();
  const signInWithGoogle = useSignInWithGoogle();
  const signInWithApple = useSignInWithApple();
  const isAppleAvailable = useAppleSignInAvailable();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting =
    signInWithEmail.isPending || signInWithGoogle.isPending || signInWithApple.isPending;

  function showSignInError(error: unknown) {
    // Supabase's wrong-password message is English only; the rest pass through as sent.
    const message =
      getErrorCode(error) === 'invalid_credentials'
        ? t(k.login.invalidCredentials)
        : getErrorMessage(error, t(k.common.unexpectedError));
    showAlertDialog(t(k.login.signInFailed), message);
  }

  function signIn() {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) {
      showAlertDialog(t(k.login.missingFields), t(k.login.missingFieldsMessage));
      return;
    }
    signInWithEmail.mutate({ email: email.trim(), password }, { onError: showSignInError });
  }

  function signInWithGoogleAccount() {
    if (isSubmitting) return;
    signInWithGoogle.mutate(undefined, { onError: showSignInError });
  }

  function signInWithAppleId() {
    if (isSubmitting) return;
    signInWithApple.mutate(undefined, { onError: showSignInError });
  }

  return {
    setEmail,
    setPassword,
    isSubmitting,
    isSigningIn: signInWithEmail.isPending,
    signIn,
    signInWithGoogle: signInWithGoogleAccount,
    isAppleAvailable,
    signInWithApple: signInWithAppleId,
    openSignUp: () => router.push('/signup'),
  };
}
