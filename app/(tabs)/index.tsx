import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Card } from '@/components/card';
import { OverviewCard } from '@/components/overview-card';
import { TransactionItem } from '@/components/transaction-item';
import { colors, design } from '@/constants/colors';
import { balance, overview, transactions } from '@/data/dummy';
import { useAuth } from '@/store';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const firstName = user?.display_name?.split(' ')[0] ?? 'there';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + design.spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={user?.profile_image} name={user?.display_name ?? ''} size={48} />
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
        </View>
        <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={22} color={colors.gray[900]} />
        </Pressable>
      </View>

      {/* Balance Card */}
      <Card variant="primary" style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.brand}>nouveau</Text>
      </Card>

      {/* Overview */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.overviewRow}>
        <OverviewCard type="income" amount={overview.income} change={overview.incomeChange} />
        <OverviewCard type="expense" amount={overview.expense} change={overview.expenseChange} />
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Pressable onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <Card style={styles.transactionsCard}>
        {transactions.map((tx, index) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            isLast={index === transactions.length - 1}
          />
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
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
    borderRadius: design.radius.sm,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...design.shadow,
  },
  balanceCard: {
    marginBottom: design.spacing.lg,
    paddingVertical: design.spacing.lg,
    paddingHorizontal: design.spacing.lg,
  },
  balanceLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: design.fontSize['3xl'],
    fontWeight: '900',
    color: colors.gray[900],
    marginTop: design.spacing.xs,
  },
  brand: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[900],
    opacity: 0.4,
    textAlign: 'right',
    marginTop: design.spacing.md,
  },
  sectionTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  overviewRow: {
    flexDirection: 'row',
    gap: design.spacing.md,
    marginTop: design.spacing.sm + 4,
    marginBottom: design.spacing.lg,
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
});
