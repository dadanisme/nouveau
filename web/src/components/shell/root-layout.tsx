import { Outlet } from '@tanstack/react-router';

import { useAuthListener } from '@/hooks/use-auth-listener';
import { useThemeSync } from '@/hooks/use-theme';

export function RootLayout() {
  useAuthListener();
  useThemeSync();
  return <Outlet />;
}
