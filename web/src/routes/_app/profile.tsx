import { createFileRoute } from '@tanstack/react-router';

import { ProfilePlaceholder } from '@/components/profile-placeholder';

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePlaceholder,
});
