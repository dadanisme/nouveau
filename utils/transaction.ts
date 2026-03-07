import type { TransactionItemData } from '@/components/transaction-item';
import type { TransactionWithCategory } from '@/hooks/use-transactions';

export function toTransactionItemData(tx: TransactionWithCategory): TransactionItemData {
  return {
    id: tx.id,
    description: tx.description,
    categoryName: tx.category.name,
    categoryColor: tx.category.color,
    categoryIcon: tx.category.icon,
    date: tx.date.split('T')[0],
    amount: tx.amount,
    type: tx.type as 'income' | 'expense',
    hasProofs: (tx.receipt_proofs?.[0]?.count ?? 0) > 0,
  };
}
