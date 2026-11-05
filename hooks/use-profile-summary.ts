import { useLanguage } from '@/contexts/language';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { k } from '@/locales/keys';

/**
 * The signed-in user's profile as Settings and Profile show it: the stored `users` row, falling
 * back to the auth user's metadata (Google / Apple name and avatar) until it loads.
 */
export function useProfileSummary() {
  const { t } = useLanguage();
  const { session } = useSession();
  const { data: user, error } = useUserProfile(session?.user.id);

  const displayName: string = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const imageUri: string | null =
    user?.profile_image ?? session?.user.user_metadata?.avatar_url ?? null;

  return {
    /** The raw name ('' when there is none), e.g. to prefill the name editor. */
    displayName,
    /** The raw email ('' when there is none). */
    email,
    /** Props for `ProfileHeaderRow`, with placeholders for a missing name or email. */
    header: {
      name: displayName || t(k.settings.unknown),
      email: email || t(k.settings.noEmail),
      imageUri,
    },
    hasError: Boolean(error),
  };
}
