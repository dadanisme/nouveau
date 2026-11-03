import { useRef } from 'react';

import { AuthForm, AuthFormSection, AuthSwitchRow } from '@/components/auth-form';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import { FormTextFieldRow, type FormTextFieldRowRef } from '@/components/form-text-field-row';
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
          label={t(k.signup.email)}
          content="newEmail"
          returnKey="next"
          onChangeText={screen.setEmail}
          onSubmit={() => passwordField.current?.focus()}
          disabled={screen.isSubmitting}
        />
        <FormTextFieldRow
          ref={passwordField}
          label={t(k.signup.password)}
          content="newPassword"
          returnKey="join"
          onChangeText={screen.setPassword}
          onSubmit={screen.signUp}
          disabled={screen.isSubmitting}
          showPasswordLabel={t(k.login.showPassword)}
          hidePasswordLabel={t(k.login.hidePassword)}
        />
      </AuthFormSection>

      <AuthFormSection>
        <FormPrimaryButtonRow
          title={t(k.signup.signUp)}
          loading={screen.isSubmitting}
          onPress={screen.signUp}
        />
        <AuthSwitchRow
          prompt={t(k.signup.hasAccount)}
          action={t(k.signup.signIn)}
          disabled={screen.isSubmitting}
          onPress={screen.openSignIn}
        />
      </AuthFormSection>
    </AuthForm>
  );
}
