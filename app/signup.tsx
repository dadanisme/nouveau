import { useRef } from 'react';

import { AppleSignInButton } from '@/components/apple-sign-in-button';
import { AuthForm, AuthFormSection, AuthLegalFooter, AuthSwitchRow } from '@/components/auth-form';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { FormTextFieldRow } from '@/components/native-form';
import type { FormTextFieldRowRef } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useSignupScreen } from '@/hooks/use-signup-screen';
import { k } from '@/locales/keys';

// Pushed from Login under a native header (back button, no title: the form's headline is it).
export default function SignUpScreen() {
  const { t } = useLanguage();
  // Return-key flow: Next on the email field moves focus to the password field.
  const passwordField = useRef<FormTextFieldRowRef>(null);
  const screen = useSignupScreen();

  return (
    <AuthForm title={t(k.signup.heading)} subtitle={t(k.signup.subtitle)}>
      <AuthFormSection>
        <FormTextFieldRow
          placeholder={t(k.signup.email)}
          keyboard="email"
          contentType="newUsername"
          submitLabel="next"
          onChangeText={screen.setEmail}
          onSubmit={() => passwordField.current?.focus()}
          disabled={screen.isSubmitting}
        />
        <FormTextFieldRow
          ref={passwordField}
          placeholder={t(k.signup.password)}
          secure
          contentType="newPassword"
          submitLabel="join"
          onChangeText={screen.setPassword}
          onSubmit={screen.signUp}
          disabled={screen.isSubmitting}
        />
      </AuthFormSection>

      <AuthFormSection>
        <FormPrimaryButtonRow
          title={t(k.signup.signUp)}
          loading={screen.isSigningUp}
          disabled={screen.isSubmitting}
          onPress={screen.signUp}
        />
        <AuthSwitchRow
          prompt={t(k.signup.hasAccount)}
          action={t(k.signup.signIn)}
          disabled={screen.isSubmitting}
          onPress={screen.openSignIn}
        />
      </AuthFormSection>

      <AuthFormSection title={t(k.login.orContinueWith)}>
        {/* Apple first: Apple requires it to be at least as prominent as other providers. */}
        {screen.isAppleAvailable ? (
          <AppleSignInButton
            variant="signUp"
            disabled={screen.isSubmitting}
            onPress={screen.signUpWithApple}
          />
        ) : null}
        <GoogleSignInButton
          title={t(k.signup.signUpWithGoogle)}
          disabled={screen.isSubmitting}
          onPress={screen.signUpWithGoogle}
        />
      </AuthFormSection>

      {/* The legal pages (#81): Signing up with any of the actions above agrees to them. */}
      <AuthLegalFooter
        text={t(k.legal.signUpAgreement)}
        termsLabel={t(k.legal.terms)}
        privacyLabel={t(k.legal.privacy)}
        onOpenTerms={screen.openTerms}
        onOpenPrivacy={screen.openPrivacy}
      />
    </AuthForm>
  );
}
