import { Outlet } from '@tanstack/react-router';

import { AppSidebar } from '@/components/shell/app-sidebar';
import { Toaster } from '@/components/ui/sonner';
import { WorkspaceProvider } from '@/contexts/workspace';

export function AppShell() {
  return (
    <WorkspaceProvider>
      <div className="flex h-full">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </WorkspaceProvider>
  );
}
