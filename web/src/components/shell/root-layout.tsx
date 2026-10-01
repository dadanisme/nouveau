import { Outlet } from '@tanstack/react-router';

import { useAuthListener } from '@/hooks/use-auth-listener';

export function RootLayout() {
  useAuthListener();
  return <Outlet />;
}
