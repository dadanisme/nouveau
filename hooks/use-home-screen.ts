import type { TransactionItemData } from '@/components/transaction-item';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { useBalance, useMonthlyTotals, useRecentTransactions } from '@/hooks/use-transactions';
import { getGreeting } from '@/utils/greeting';

export function useHomeScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: user } = useUserProfile(userId);

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const firstName = displayName.split(' ')[0] || 'there';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;
  const greeting = getGreeting();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const { data: balance } = useBalance(userId);
  const { data: currentTotals } = useMonthlyTotals(userId, currentYear, currentMonth);
  const { data: prevTotals } = useMonthlyTotals(userId, prevYear, prevMonth);
  const { data: recentTx, isLoading: isLoadingTransactions } = useRecentTransactions(userId);

  const currentIncome = currentTotals?.income ?? 0;
  const currentExpense = currentTotals?.expense ?? 0;
  const prevIncome = prevTotals?.income ?? 0;
  const prevExpense = prevTotals?.expense ?? 0;

  const incomeChange =
    prevIncome > 0 ? Math.round(((currentIncome - prevIncome) / prevIncome) * 1000) / 10 : 0;
  const expenseChange =
    prevExpense > 0 ? Math.round(((currentExpense - prevExpense) / prevExpense) * 1000) / 10 : 0;

  const overview = {
    income: currentIncome,
    incomeChange,
    expense: currentExpense,
    expenseChange,
  };

  const transactions: TransactionItemData[] = (recentTx ?? []).map((tx) => ({
    id: tx.id,
    description: tx.description,
    categoryName: tx.category.name,
    categoryColor: tx.category.color,
    categoryIcon: tx.category.icon,
    date: tx.date,
    amount: tx.amount,
    type: tx.type as 'income' | 'expense',
  }));

  return {
    greeting,
    firstName,
    displayName,
    profileImage,
    balance: balance ?? 0,
    overview,
    transactions,
    isLoadingTransactions,
  };
}
