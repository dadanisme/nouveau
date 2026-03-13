import { useCallback, useState } from 'react';

import { useSession, useUserProfile } from '@/hooks/use-auth';
import { useBalance, useMonthlyTotals, useRecentTransactions } from '@/hooks/use-transactions';
import { getGreeting } from '@/utils/greeting';
import { toTransactionItemData } from '@/utils/transaction';

const BALANCE_HIDDEN_KEY = 'balance_hidden';

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

  const balanceQuery = useBalance(userId);
  const currentTotalsQuery = useMonthlyTotals(userId, currentYear, currentMonth);
  const prevTotalsQuery = useMonthlyTotals(userId, prevYear, prevMonth);
  const recentTxQuery = useRecentTransactions(userId);

  const balance = balanceQuery.data;
  const currentTotals = currentTotalsQuery.data;
  const prevTotals = prevTotalsQuery.data;
  const recentTx = recentTxQuery.data;
  const isLoadingTransactions = recentTxQuery.isLoading;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem(BALANCE_HIDDEN_KEY) === 'true',
  );

  const toggleBalanceHidden = useCallback(() => {
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem(BALANCE_HIDDEN_KEY, String(next));
      return next;
    });
  }, []);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        balanceQuery.refetch(),
        currentTotalsQuery.refetch(),
        prevTotalsQuery.refetch(),
        recentTxQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [balanceQuery, currentTotalsQuery, prevTotalsQuery, recentTxQuery]);

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

  const transactions = (recentTx ?? []).map(toTransactionItemData);

  return {
    greeting,
    firstName,
    displayName,
    profileImage,
    balance: balance ?? 0,
    overview,
    transactions,
    isLoadingTransactions,
    isRefreshing,
    refetch,
    balanceHidden,
    toggleBalanceHidden,
  };
}
