import { useSession, useSignOut, useUserProfile } from '@/hooks/use-auth';

/**
 * What the profile page shows. Same sources and fallbacks as mobile's settings screen: the
 * `users` row first, then the auth provider's metadata (Google name and picture).
 */
export function useProfile() {
  const { session, isLoading: isSessionLoading } = useSession();
  const profileQuery = useUserProfile(session?.user.id);
  const signOut = useSignOut();

  const user = profileQuery.data;
  const metadata = session?.user.user_metadata;
  const fromMetadata = (key: string): string =>
    typeof metadata?.[key] === 'string' ? metadata[key] : '';

  return {
    name: user?.display_name ?? fromMetadata('full_name'),
    email: user?.email ?? session?.user.email ?? '',
    imageUrl: user?.profile_image ?? (fromMetadata('avatar_url') || null),
    isLoading: isSessionLoading || (!!session && profileQuery.isPending),
    error: profileQuery.error,
    signOut: () => signOut.mutate(),
    isSigningOut: signOut.isPending,
    signOutError: signOut.error,
  };
}
