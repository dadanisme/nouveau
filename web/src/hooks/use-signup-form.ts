import { useState } from 'react';

import { useSignUpWithEmail } from '@/hooks/use-auth';
import { en } from '@/locales/en';

export function useSignupForm() {
  const signUpWithEmail = useSignUpWithEmail();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const submit = () => {
    if (!email.trim() || !password.trim()) {
      setError(en.signup.missingFieldsMessage);
      return;
    }
    setError(null);
    setNeedsEmailConfirmation(false);
    signUpWithEmail.mutate(
      { email: email.trim(), password },
      {
        // If the project does not require confirmation, a session comes back straight away
        // and the route guard redirects to `/` instead.
        onSuccess: (result) => setNeedsEmailConfirmation(result.needsEmailConfirmation),
        onError: (err) => setError(err instanceof Error ? err.message : en.common.unexpectedError),
      },
    );
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    error,
    needsEmailConfirmation,
    isSubmitting: signUpWithEmail.isPending,
    submit,
  };
}
