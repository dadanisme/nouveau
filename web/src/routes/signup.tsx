import { createFileRoute, redirect } from '@tanstack/react-router';

import { SignupForm } from '@/components/auth/signup-form';
import { sessionQueryOptions } from '@/hooks/use-auth';

export const Route = createFileRoute('/signup')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (session) throw redirect({ to: '/' });
  },
  component: SignupForm,
});
