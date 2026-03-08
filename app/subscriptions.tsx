import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useSession } from '@/hooks/use-auth';
import i18n, { getDateLocale } from '@/lib/i18n';
import { k } from '@/locales/keys';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import type { Tables } from '@/types/supabase';

type SubscriptionWithFeature = Tables<'feature_subscriptions'> & {
  feature: Tables<'features'> | null;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString(getDateLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SubscriptionRow({
  subscription,
  isLast,
}: {
  subscription: SubscriptionWithFeature;
  isLast: boolean;
}) {
  const isRevoked = subscription.status === 'revoked';
  const dateLabel = isRevoked ? i18n.t(k.subscriptions.revoked) : i18n.t(k.subscriptions.granted);
  const dateValue = isRevoked ? subscription.revoked_at : subscription.granted_at;

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowContent}>
        <Text style={styles.rowName} numberOfLines={1}>
          {subscription.feature?.name ?? i18n.t(k.subscriptions.unknownFeature)}
        </Text>
        <Text style={styles.rowDate}>
          {dateLabel} {formatDate(dateValue)}
        </Text>
      </View>
      <Ionicons
        name={isRevoked ? 'close-circle' : 'checkmark-circle'}
        size={22}
        color={isRevoked ? colors.expense : colors.income}
      />
    </View>
  );
}

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { t } = useLanguage();
  const {
    data: subscriptions,
    isLoading,
    refetch: queryRefetch,
  } = useSubscriptions(session?.user.id);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryRefetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryRefetch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>{t(k.subscriptions.title)}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + design.spacing.lg },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
              progressViewOffset={insets.top}
            />
          }
        >
          {subscriptions && subscriptions.length > 0 ? (
            <View style={styles.listCard}>
              {subscriptions.map((sub, i) => (
                <SubscriptionRow
                  key={sub.id}
                  subscription={sub}
                  isLast={i === subscriptions.length - 1}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>{t(k.subscriptions.noSubscriptions)}</Text>
              <Text style={styles.emptySubtext}>{t(k.subscriptions.noSubscriptionsMessage)}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: design.spacing.lg,
    paddingVertical: design.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: design.radius.lg,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    ...design.shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md - 2,
    paddingHorizontal: design.spacing.md,
    gap: design.spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
  },
  rowDate: {
    fontSize: design.fontSize.xs,
    fontWeight: '500',
    color: colors.gray[400],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.xl * 2,
    gap: design.spacing.sm,
  },
  emptyText: {
    fontSize: design.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[400],
  },
  emptySubtext: {
    fontSize: design.fontSize.sm,
    color: colors.gray[400],
  },
});
