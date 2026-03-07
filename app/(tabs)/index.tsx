import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTabScreen } from '@/components/animated-tab-screen';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TransactionItem } from '@/components/transaction-item';
import { TransactionItemSkeleton } from '@/components/transaction-item-skeleton';
import { colors, design } from '@/constants/colors';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';
import { useHomeScreen } from '@/hooks/use-home-screen';
import { formatCompactAmount, formatCurrency } from '@/utils/currency';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    greeting,
    firstName,
    displayName,
    profileImage,
    balance,
    overview,
    transactions,
    isLoadingTransactions,
    isRefreshing,
    refetch,
  } = useHomeScreen();
  const { requestDelete, deleteConfirmAlert } = useDeleteConfirmation();

  return (
    <AnimatedTabScreen index={0}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + design.spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar uri={profileImage} name={displayName} size={48} />
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
          </View>
          <Button
            variant="outline"
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={22} color={colors.gray[900]} />
          </Button>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <View style={styles.overviewLabelRow}>
                <Ionicons name="arrow-down" size={14} color={colors.income} />
                <Text style={styles.overviewLabel}>Income</Text>
              </View>
              <Text style={styles.overviewAmount}>
                {formatCompactAmount(overview.income)}{' '}
                <Text
                  style={{
                    fontSize: design.fontSize.xs,
                    fontWeight: '700',
                    color:
                      overview.incomeChange === 0
                        ? colors.gray[500]
                        : overview.incomeChange > 0
                          ? colors.income
                          : colors.expense,
                  }}
                >
                  ({overview.incomeChange > 0 ? '+' : ''}
                  {overview.incomeChange}%)
                </Text>
              </Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <View style={styles.overviewLabelRow}>
                <Ionicons name="arrow-up" size={14} color={colors.expense} />
                <Text style={styles.overviewLabel}>Expenses</Text>
              </View>
              <Text style={styles.overviewAmount}>
                {formatCompactAmount(overview.expense)}{' '}
                <Text
                  style={{
                    fontSize: design.fontSize.xs,
                    fontWeight: '700',
                    color:
                      overview.expenseChange === 0
                        ? colors.gray[500]
                        : overview.expenseChange < 0
                          ? colors.income
                          : colors.expense,
                  }}
                >
                  ({overview.expenseChange > 0 ? '+' : ''}
                  {overview.expenseChange}%)
                </Text>
              </Text>
            </View>
          </View>
        </Card>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <Card style={styles.transactionsCard}>
          {isLoadingTransactions ? (
            Array.from({ length: 4 }, (_, i) => (
              <TransactionItemSkeleton key={i} isLast={i === 3} />
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                isLast={index === transactions.length - 1}
                onPress={() => router.push({ pathname: '/add-transaction', params: { id: tx.id } })}
                onViewProofs={() =>
                  router.push({ pathname: '/proof-viewer', params: { transactionId: tx.id } })
                }
                onDelete={() => requestDelete(tx.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </Card>
      </ScrollView>

      {deleteConfirmAlert}
    </AnimatedTabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: TAB_BAR_HEIGHT + design.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: design.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
  },
  greeting: {
    fontSize: design.fontSize.sm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  name: {
    fontSize: design.fontSize.xl,
    fontWeight: '800',
    color: colors.gray[900],
  },
  settingsButton: {
    width: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  balanceCard: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.lg,
    paddingHorizontal: design.spacing.lg,
    backgroundColor: colors.primary.light,
  },
  balanceLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: design.fontSize['2xl'],
    fontWeight: '900',
    color: colors.gray[900],
    marginTop: design.spacing.xs,
  },
  overviewRow: {
    flexDirection: 'row',
    marginTop: design.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[900] + '20',
    paddingTop: design.spacing.sm + 4,
  },
  overviewItem: {
    flex: 1,
    gap: 2,
  },
  overviewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overviewLabel: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[900],
    opacity: 0.6,
  },
  overviewAmount: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.gray[900],
  },
  overviewDivider: {
    width: 1,
    backgroundColor: colors.gray[900] + '20',
    marginHorizontal: design.spacing.md,
  },
  sectionTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: design.spacing.sm + 4,
  },
  seeAll: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.primary.dark,
  },
  transactionsCard: {
    paddingVertical: design.spacing.xs,
  },
  emptyText: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: design.spacing.lg,
  },
});
