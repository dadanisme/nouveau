import { useRef } from 'react';

import { AppleSignInButton } from '@/components/apple-sign-in-button';
import { AuthForm, AuthFormSection, AuthLegalFooter, AuthSwitchRow } from '@/components/auth-form';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import { FormTextFieldRow } from '@/components/native-form';
import type { FormTextFieldRowRef } from '@/components/native-form-types';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { useLanguage } from '@/contexts/language';
import { useLoginScreen } from '@/hooks/use-login-screen';
import { k } from '@/locales/keys';

// The form is the screen's root view under a native bar with only Back (to Welcome).
export default function LoginScreen() {
  const { t } = useLanguage();
  // Return-key flow: Next on the email field moves focus to the password field.
  const passwordField = useRef<FormTextFieldRowRef>(null);
  const screen = useLoginScreen();

  return (
    <AuthForm title={t(k.login.heading)} subtitle={t(k.login.subtitle)}>
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
        {/* Apple first: Apple requires it to be at least as prominent as other providers. */}
        {screen.isAppleAvailable ? (
          <AppleSignInButton
            variant="signIn"
            disabled={screen.isSubmitting}
            onPress={screen.signInWithApple}
          />
        ) : null}
        <GoogleSignInButton
          title={t(k.login.signInWithGoogle)}
          disabled={screen.isSubmitting}
          onPress={screen.signInWithGoogle}
        />
      </AuthFormSection>

      {/* The legal pages (#81): Apple and Google create an account on first use here too agrees to them. */}
      <AuthLegalFooter
        text={t(k.legal.signInAgreement)}
        termsLabel={t(k.legal.terms)}
        privacyLabel={t(k.legal.privacy)}
        onOpenTerms={screen.openTerms}
        onOpenPrivacy={screen.openPrivacy}
      />
    </AuthForm>
  );
}
