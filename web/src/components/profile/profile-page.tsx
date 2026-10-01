import { LogOutIcon } from 'lucide-react';

import { FormMessage } from '@/components/auth/form-message';
import { Page } from '@/components/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/use-profile';
import { en } from '@/locales/en';
import { getInitials } from '@/utils/string';

const t = en.profile;

/**
 * The account: avatar or initials, name, email and sign out. Read-only, like the profile card
 * on mobile's settings screen (mobile has no way to edit the name either).
 */
export function ProfilePage() {
  const profile = useProfile();

  return (
    <Page title={t.title}>
      <div className="flex max-w-md flex-col gap-4">
        {profile.error && (
          <FormMessage variant="error" title={t.loadFailed} message={profile.error.message} />
        )}

        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {profile.imageUrl && <AvatarImage src={profile.imageUrl} alt="" />}
            <AvatarFallback className="bg-primary-soft text-xl font-semibold text-foreground">
              {getInitials(profile.name || profile.email)}
            </AvatarFallback>
          </Avatar>
          {profile.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-44" />
            </div>
          ) : (
            <dl className="min-w-0">
              <dt className="sr-only">{t.name}</dt>
              <dd className="truncate text-base font-semibold">{profile.name || t.unknown}</dd>
              <dt className="sr-only">{t.email}</dt>
              <dd className="truncate text-muted-foreground">{profile.email || t.noEmail}</dd>
            </dl>
          )}
        </div>

        {profile.signOutError && (
          <FormMessage
            variant="error"
            title={t.signOutFailed}
            message={profile.signOutError.message}
          />
        )}

        <div className="border-t pt-4">
          <Button variant="outline" onClick={profile.signOut} disabled={profile.isSigningOut}>
            <LogOutIcon />
            {profile.isSigningOut ? en.common.pleaseWait : t.signOut}
          </Button>
        </div>
      </div>
    </Page>
  );
}
