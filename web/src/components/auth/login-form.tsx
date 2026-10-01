import { Link } from '@tanstack/react-router';

import { AuthLayout } from '@/components/auth/auth-layout';
import { FormMessage } from '@/components/auth/form-message';
import { GoogleIcon } from '@/components/auth/google-icon';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/hooks/use-login-form';
import { en } from '@/locales/en';

export function LoginForm() {
  const form = useLoginForm();

  return (
    <AuthLayout heading={en.login.heading} subtitle={en.login.subtitle}>
      <form
        className="flex flex-col gap-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          form.submit();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{en.login.email}</Label>
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
          <Label htmlFor="password">{en.login.password}</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
            disabled={form.isSubmitting}
            visible={form.showPassword}
            onToggleVisible={form.toggleShowPassword}
          />
        </div>

        {form.error && (
          <FormMessage variant="error" title={en.login.signInFailed} message={form.error} />
        )}

        <Button type="submit" size="lg" disabled={form.isSubmitting}>
          {form.isSubmitting ? en.common.pleaseWait : en.login.signIn}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {en.login.orContinueWith}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full bg-card"
        onClick={form.submitGoogle}
        disabled={form.isSubmitting}
      >
        <GoogleIcon className="size-4" />
        {en.login.signInWithGoogle}
      </Button>

      <p className="mt-6 text-center text-muted-foreground">
        {en.login.noAccount}{' '}
        <Link
          to="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {en.login.signUp}
        </Link>
      </p>
    </AuthLayout>
  );
}
