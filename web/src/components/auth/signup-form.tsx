import { Link } from '@tanstack/react-router';

import { AuthLayout } from '@/components/auth/auth-layout';
import { FormMessage } from '@/components/auth/form-message';
import { PasswordInput } from '@/components/auth/password-input';
import { LegalLink } from '@/components/legal/legal-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSignupForm } from '@/hooks/use-signup-form';
import { LEGAL_URLS } from '@/lib/legal';
import { en } from '@/locales/en';

export function SignupForm() {
  const form = useSignupForm();

  return (
    <AuthLayout heading={en.signup.heading} subtitle={en.signup.subtitle}>
      <form
        className="flex flex-col gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          form.submit();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{en.signup.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="bg-card"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            disabled={form.isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{en.signup.password}</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
            disabled={form.isSubmitting}
            visible={form.showPassword}
            onToggleVisible={form.toggleShowPassword}
          />
        </div>

        {form.error && (
          <FormMessage variant="error" title={en.signup.signUpFailed} message={form.error} />
        )}
        {form.needsEmailConfirmation && (
          <FormMessage
            variant="info"
            title={en.signup.checkEmail}
            message={en.signup.checkEmailMessage}
          />
        )}

        <Button type="submit" size="lg" disabled={form.isSubmitting}>
          {form.isSubmitting ? en.common.pleaseWait : en.signup.signUp}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {en.legal.signUpAgreementStart}{' '}
          <LegalLink href={LEGAL_URLS.terms} className="text-foreground underline">
            {en.legal.terms}
          </LegalLink>{' '}
          {en.legal.signUpAgreementAnd}{' '}
          <LegalLink href={LEGAL_URLS.privacy} className="text-foreground underline">
            {en.legal.privacy}
          </LegalLink>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-muted-foreground">
        {en.signup.hasAccount}{' '}
        <Link
          to="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {en.signup.signIn}
        </Link>
      </p>
    </AuthLayout>
  );
}
