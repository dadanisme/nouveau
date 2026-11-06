import { useQuery } from '@tanstack/react-query';

import { useGuestSession, useSession } from '@/hooks/use-auth';
import { useDataSource } from '@/hooks/use-data-source';
import { useMyWorkspaces } from '@/hooks/use-workspaces';

/**
 * Whether a signed-in account still needs the onboarding currency step (#78): a brand-new account,
 * whose Personal workspace was never updated (`updated_at` still equals `created_at`) and holds no
 * transaction. Saving the step writes `home_currency`, which bumps `updated_at` (a server trigger),
 * so no device asks again. A guest picks their currency before they start, so never needs it.
 *
 * `isChecking` is true while that's still being read; a failed read counts as not needed.
 */
export function useCurrencyStepNeeded(): { isNeeded: boolean; isChecking: boolean } {
  const { session } = useSession();
  const { guestId } = useGuestSession();
  const source = useDataSource();
  const isAccount = !!session && !guestId;

  const workspaces = useMyWorkspaces();
  const personal = isAccount
    ? workspaces.data?.find((workspace) => workspace.is_personal)
    : undefined;
  const isUntouched = !!personal && personal.updated_at === personal.created_at;

  const hasTransactions = useQuery({
    queryKey: ['has-transactions', personal?.id],
    queryFn: () => source!.hasTransactions(personal!.id),
    enabled: isUntouched && !!source,
  });

  return {
    isNeeded: isUntouched && hasTransactions.data === false,
    isChecking: isAccount && (workspaces.isLoading || (isUntouched && hasTransactions.isLoading)),
  };
}
