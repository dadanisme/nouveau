import { useGuestSession, useSession } from '@/hooks/use-auth';
import { localDataSource } from '@/lib/data/local';
import { remoteDataSource } from '@/lib/data/remote';
import type { DataSource } from '@/lib/data/types';

/**
 * Where the data hooks read and write: Supabase with a session, the on-device store for a guest
 * (#100), otherwise null (signed out, or the session is still loading). A session wins over a
 * leftover guest id.
 */
export function useDataSource(): DataSource | null {
  const { session } = useSession();
  const { guestId } = useGuestSession();
  if (session) return remoteDataSource;
  if (guestId) return localDataSource;
  return null;
}

/** The id rows are written under: the signed-in user's, or the guest's. */
export function useCurrentUserId(): string | undefined {
  const { session } = useSession();
  const { guestId } = useGuestSession();
  return session?.user.id ?? guestId ?? undefined;
}

/** The source a mutation writes to; there is none while signed out. */
export function requireDataSource(source: DataSource | null): DataSource {
  if (!source) throw new Error('Not signed in');
  return source;
}
