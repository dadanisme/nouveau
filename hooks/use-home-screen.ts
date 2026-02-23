import type { TransactionItemData } from '@/components/transaction-item';
import { balance, overview, transactions } from '@/data/dummy';
import { useSession, useUserProfile } from '@/hooks/use-auth';
import { getGreeting } from '@/utils/greeting';

export function useHomeScreen() {
  const { session } = useSession();
  const { data: user } = useUserProfile(session?.user.id);

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const firstName = displayName.split(' ')[0] || 'there';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;
  const greeting = getGreeting();

  const transactionItems: TransactionItemData[] = transactions.map((tx) => ({
    id: tx.id,
    description: tx.description,
    categoryName: tx.category,
    categoryColor: tx.categoryColor,
    categoryIcon: null,
    date: tx.date,
    amount: tx.amount,
    type: tx.type,
  }));

  return {
    greeting,
    firstName,
    displayName,
    profileImage,
    balance,
    overview,
    transactions: transactionItems,
  };
}
