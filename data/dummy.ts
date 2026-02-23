export interface OverviewData {
  income: number;
  incomeChange: number;
  expense: number;
  expenseChange: number;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  categoryColor: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

export const balance = 24850.75;

export const overview: OverviewData = {
  income: 8420.0,
  incomeChange: 12.5,
  expense: 3280.5,
  expenseChange: -4.2,
};

export const transactions: Transaction[] = [
  {
    id: '1',
    description: 'Salary Deposit',
    category: 'Salary',
    categoryColor: '#22C55E',
    date: '2026-02-23',
    amount: 5000.0,
    type: 'income',
  },
  {
    id: '2',
    description: 'Grocery Store',
    category: 'Groceries',
    categoryColor: '#F59E0B',
    date: '2026-02-22',
    amount: 87.5,
    type: 'expense',
  },
  {
    id: '3',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    categoryColor: '#8B5CF6',
    date: '2026-02-21',
    amount: 15.99,
    type: 'expense',
  },
  {
    id: '4',
    description: 'Freelance Payment',
    category: 'Freelance',
    categoryColor: '#3B82F6',
    date: '2026-02-20',
    amount: 1200.0,
    type: 'income',
  },
  {
    id: '5',
    description: 'Electric Bill',
    category: 'Utilities',
    categoryColor: '#EF4444',
    date: '2026-02-19',
    amount: 142.3,
    type: 'expense',
  },
  {
    id: '6',
    description: 'Coffee Shop',
    category: 'Food & Drink',
    categoryColor: '#EC4899',
    date: '2026-02-18',
    amount: 6.5,
    type: 'expense',
  },
];
