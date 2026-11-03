import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSignInWithEmail, useSignInWithGoogle } from '@/hooks/use-auth';
import { k } from '@/locales/keys';

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
    Alert.alert(
      t(k.login.signInFailed),
      error instanceof Error ? error.message : t(k.common.unexpectedError),
    );
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
