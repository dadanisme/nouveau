import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';

import { FormMessage } from '@/components/auth/form-message';
import { Page } from '@/components/page';
import { SegmentedControl, type SegmentedOption } from '@/components/segmented-control';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { en } from '@/locales/en';
import { getInitials } from '@/utils/string';
import type { ThemePreference } from '@/utils/theme';

const t = en.profile;

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: t.themeSystem, icon: <MonitorIcon /> },
  { value: 'light', label: t.themeLight, icon: <SunIcon /> },
  { value: 'dark', label: t.themeDark, icon: <MoonIcon /> },
];

/**
 * The account: avatar or initials, name, email and sign out. Read-only, like the profile card
 * on mobile's settings screen (mobile has no way to edit the name either). Below it, the
 * appearance setting, which belongs to this browser rather than the account.
 */
export function ProfilePage() {
  const profile = useProfile();
  const { preference, setPreference } = useTheme();

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

        <section aria-labelledby="appearance-heading" className="flex flex-col gap-2 border-t pt-4">
          <div>
            <h2 id="appearance-heading" className="font-medium">
              {t.appearance}
            </h2>
            <p className="text-muted-foreground">{t.appearanceHint}</p>
          </div>
          <SegmentedControl
            label={t.theme}
            options={THEME_OPTIONS}
            value={preference}
            onChange={setPreference}
            className="self-start"
          />
        </section>

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
