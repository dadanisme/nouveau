import { Link, type LinkProps } from '@tanstack/react-router';
import { ArrowLeftRight, type LucideIcon, Tags } from 'lucide-react';

import { en } from '@/locales/en';

const NAV_ITEMS: { to: LinkProps['to']; label: string; icon: LucideIcon; exact: boolean }[] = [
  { to: '/', label: en.nav.transactions, icon: ArrowLeftRight, exact: true },
  { to: '/categories', label: en.nav.categories, icon: Tags, exact: false },
];

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact }}
          className="flex h-8 items-center gap-2 rounded-md px-2 font-medium text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
