import { Link } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { getInitials } from '@/utils/string';

export function SidebarUser() {
  const { session } = useSession();
  const { data: profile } = useUserProfile(session?.user.id);

  const email = profile?.email ?? session?.user.email ?? '';
  const name = profile?.display_name || email;

  return (
    <Link
      to="/profile"
      className="flex items-center gap-2 rounded-md p-2 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[status=active]:bg-sidebar-accent"
    >
      <Avatar className="size-7">
        {profile?.profile_image && <AvatarImage src={profile.profile_image} alt="" />}
        <AvatarFallback className="bg-primary-soft text-xs font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-medium text-sidebar-accent-foreground">{name}</p>
        {email !== name && <p className="truncate text-xs text-muted-foreground">{email}</p>}
      </div>
    </Link>
  );
}
