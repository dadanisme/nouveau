import { useState } from 'react';

import { useSignInWithEmail, useSignInWithGoogle } from '@/hooks/use-auth';
import { en } from '@/locales/en';

export function useLoginForm() {
  const signInWithEmail = useSignInWithEmail();
  const signInWithGoogle = useSignInWithGoogle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = signInWithEmail.isPending || signInWithGoogle.isPending;

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : en.common.unexpectedError);
  };

  // On success the auth listener updates the session and the route guard redirects to `/`.
  const submit = () => {
    if (!email.trim() || !password.trim()) {
      setError(en.login.missingFieldsMessage);
      return;
    }
    setError(null);
    signInWithEmail.mutate({ email: email.trim(), password }, { onError: handleError });
  };

  const submitGoogle = () => {
    setError(null);
    signInWithGoogle.mutate(undefined, { onError: handleError });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((value) => !value),
    error,
    isSubmitting,
    submit,
    submitGoogle,
  };
}
