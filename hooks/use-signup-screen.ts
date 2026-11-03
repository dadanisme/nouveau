import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSignUpWithEmail } from '@/hooks/use-auth';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';

/** Screen hook for Signup: the email/new-password form and the switch back to Sign In. */
export function useSignupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const signUpWithEmail = useSignUpWithEmail();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = signUpWithEmail.isPending;

  function signUp() {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert(t(k.signup.missingFields), t(k.signup.missingFieldsMessage));
      return;
    }
    signUpWithEmail.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          Alert.alert(t(k.signup.checkEmail), t(k.signup.checkEmailMessage));
        },
        onError: (error) => {
          Alert.alert(
            t(k.signup.signUpFailed),
            getErrorMessage(error, t(k.common.unexpectedError)),
          );
        },
      },
    );
  }

  return {
    setEmail,
    setPassword,
    isSubmitting,
    signUp,
    openSignIn: () => router.back(),
  };
}
