import { Check, ChevronsUpDown, User, Users } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/workspace-context';
import { en } from '@/locales/en';

export function WorkspaceSwitcher() {
  const { currentWorkspace, currentWorkspaceId, workspaces, switchWorkspace, isLoading } =
    useWorkspace();

  const label = currentWorkspace?.name ?? (isLoading ? en.common.loading : en.workspace.none);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={en.workspace.switch}
        className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left font-medium text-sidebar-accent-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
      >
        <span
          aria-hidden
          className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground"
        >
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{en.workspace.switch}</DropdownMenuLabel>
        {workspaces.length === 0 && !isLoading && (
          <p className="px-2 py-1.5 text-muted-foreground">{en.workspace.noneMessage}</p>
        )}
        {workspaces.map((workspace) => {
          const Icon = workspace.is_personal ? User : Users;
          const isActive = workspace.id === currentWorkspaceId;
          return (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => {
                if (!isActive) switchWorkspace(workspace.id);
              }}
            >
              <Icon className="text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">
                  {workspace.is_personal ? en.workspace.personal : en.workspace.shared}
                  {' · '}
                  {workspace.home_currency}
                </p>
              </div>
              {isActive && <Check className="text-primary-strong" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
