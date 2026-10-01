import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginForm } from '@/components/auth/login-form';
import { sessionQueryOptions } from '@/hooks/use-auth';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (session) throw redirect({ to: '/' });
  },
  component: LoginForm,
});
