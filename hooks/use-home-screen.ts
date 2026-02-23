import { balance, overview, transactions } from '@/data/dummy';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { getGreeting } from '@/utils/greeting';

export function useHomeScreen() {
  const { session } = useSession();
  const { data: user } = useUserProfile(session?.user.id);

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const firstName = displayName.split(' ')[0] || 'there';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;
  const greeting = getGreeting();

  return {
    greeting,
    firstName,
    displayName,
    profileImage,
    balance,
    overview,
    transactions,
  };
}
