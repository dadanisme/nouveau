import { createFileRoute, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/shell/app-shell';
import { sessionQueryOptions } from '@/hooks/use-auth';

// Pathless layout: every route under `_app/` requires a session and renders inside the shell.
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) throw redirect({ to: '/login' });
  },
  component: AppShell,
});
