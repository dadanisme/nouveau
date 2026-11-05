import { useRouter } from 'expo-router';

import { useLinkedProviders } from '@/hooks/use-auth';
import { useProfileSummary } from '@/hooks/use-profile-summary';
import { getSignInMethods } from '@/utils/sign-in-methods';

/**
 * Screen hook for Profile (pushed from Settings' profile row): the header, the name (opens the
 * name editor), the email, the linked sign-in methods, and the way to Delete Account.
 */
export function useProfileScreen() {
  const router = useRouter();
  const profile = useProfileSummary();
  const providers = useLinkedProviders();

  return {
    header: profile.header,
    hasProfileError: profile.hasError,
    displayName: profile.displayName,
    email: profile.header.email,
    signInMethods: getSignInMethods(providers.data ?? []),
    isSignInMethodsLoading: providers.isLoading,
    hasSignInMethodsError: providers.isError,
    openName: () => router.push('/profile-name'),
    openDeleteAccount: () => router.push('/delete-account'),
  };
}
