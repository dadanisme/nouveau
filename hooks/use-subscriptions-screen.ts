import { useCallback, useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useSession } from '@/hooks/use-auth';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { k } from '@/locales/keys';
import { formatMediumDate } from '@/utils/date';

export type SubscriptionRow = {
  id: string;
  title: string;
  /** "Granted Mar 4, 2026" / "Revoked Mar 4, 2026". */
  detail: string;
  isRevoked: boolean;
};

/** Screen hook for Subscriptions: the user's feature subscriptions as rows, plus pull-to-refresh. */
export function useSubscriptionsScreen() {
  const { t } = useLanguage();
  const { session } = useSession();
  const { data, isLoading, isError, refetch } = useSubscriptions(session?.user.id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const rows: SubscriptionRow[] = (data ?? []).map((subscription) => {
    const isRevoked = subscription.status === 'revoked';
    const date = isRevoked ? subscription.revoked_at : subscription.granted_at;
    const label = t(isRevoked ? k.subscriptions.revoked : k.subscriptions.granted);
    return {
      id: subscription.id,
      title: subscription.feature?.name ?? t(k.subscriptions.unknownFeature),
      detail: date ? `${label} ${formatMediumDate(date)}` : label,
      isRevoked,
    };
  });

  return {
    rows,
    isLoading,
    hasError: isError && !data,
    isRefreshing,
    refresh,
  };
}
