import { useRef } from 'react';

import { AuthForm, AuthFormSection, AuthSwitchRow } from '@/components/auth-form';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import { FormTextFieldRow } from '@/components/native-form';
import type { FormTextFieldRowRef } from '@/components/native-form-types';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { useLanguage } from '@/contexts/language';
import { useLoginScreen } from '@/hooks/use-login-screen';
import { k } from '@/locales/keys';

// The form is the screen's root view (no header: this is the signed-out root).
export default function LoginScreen() {
  const { t } = useLanguage();
  // Return-key flow: Next on the email field moves focus to the password field.
  const passwordField = useRef<FormTextFieldRowRef>(null);
  const screen = useLoginScreen();

  return (
    <AuthForm title={t(k.login.heading)} subtitle={t(k.login.subtitle)} insetTop>
      <AuthFormSection>
        <FormTextFieldRow
          placeholder={t(k.login.email)}
          keyboard="email"
          contentType="username"
          submitLabel="next"
          onChangeText={screen.setEmail}
          onSubmit={() => passwordField.current?.focus()}
          disabled={screen.isSubmitting}
        />
        <FormTextFieldRow
          ref={passwordField}
          placeholder={t(k.login.password)}
          secure
          contentType="password"
          submitLabel="go"
          onChangeText={screen.setPassword}
          onSubmit={screen.signIn}
          disabled={screen.isSubmitting}
        />
      </AuthFormSection>

      <AuthFormSection>
        <FormPrimaryButtonRow
          title={t(k.login.signIn)}
          loading={screen.isSigningIn}
          disabled={screen.isSubmitting}
          onPress={screen.signIn}
        />
        <AuthSwitchRow
          prompt={t(k.login.noAccount)}
          action={t(k.login.signUp)}
          disabled={screen.isSubmitting}
          onPress={screen.openSignUp}
        />
      </AuthFormSection>

      <AuthFormSection title={t(k.login.orContinueWith)}>
        {/* Sign in with Apple (#35) goes HERE, above Google: Apple requires it to be at least as
            prominent as other third-party sign-in options. Same full-width, 50pt-high clear row
            as the Google button (SOCIAL_BUTTON_HEIGHT). */}
        <GoogleSignInButton
          title={t(k.login.signInWithGoogle)}
          disabled={screen.isSubmitting}
          onPress={screen.signInWithGoogle}
        />
      </AuthFormSection>
    </AuthForm>
  );
}
