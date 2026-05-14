import { useSession, useUserProfile } from '@/hooks/use-auth';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { getGreeting } from '@/utils/greeting';

export function useProfileHeader() {
  const { session } = useSession();
  const { data: user } = useUserProfile(session?.user.id);

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const firstName = displayName.split(' ')[0] || i18n.t(k.greeting.fallbackName);
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;
  const greeting = getGreeting();

  return { displayName, firstName, profileImage, greeting };
}
