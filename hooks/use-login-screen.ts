import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSignInWithEmail, useSignInWithGoogle } from '@/hooks/use-auth';
import { k } from '@/locales/keys';
import { getErrorCode, getErrorMessage } from '@/utils/error';

/** Screen hook for Login: the email/password form, Google sign-in and the switch to Sign Up. */
export function useLoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const signInWithEmail = useSignInWithEmail();
  const signInWithGoogle = useSignInWithGoogle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = signInWithEmail.isPending || signInWithGoogle.isPending;

  function showSignInError(error: unknown) {
    // Supabase's wrong-password message is English only; the rest pass through as sent.
    const message =
      getErrorCode(error) === 'invalid_credentials'
        ? t(k.login.invalidCredentials)
        : getErrorMessage(error, t(k.common.unexpectedError));
    Alert.alert(t(k.login.signInFailed), message);
  }

  function signIn() {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert(t(k.login.missingFields), t(k.login.missingFieldsMessage));
      return;
    }
    signInWithEmail.mutate({ email: email.trim(), password }, { onError: showSignInError });
  }

  function signInWithGoogleAccount() {
    signInWithGoogle.mutate(undefined, { onError: showSignInError });
  }

  return {
    setEmail,
    setPassword,
    isSubmitting,
    isSigningIn: signInWithEmail.isPending,
    signIn,
    signInWithGoogle: signInWithGoogleAccount,
    openSignUp: () => router.push('/signup'),
  };
}
