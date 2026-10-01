import { SidebarNav } from '@/components/shell/sidebar-nav';
import { SidebarUser } from '@/components/shell/sidebar-user';
import { WorkspaceSwitcher } from '@/components/shell/workspace-switcher';

export function AppSidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-2">
      <WorkspaceSwitcher />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border pt-2">
        <SidebarUser />
      </div>
    </aside>
  );
}
