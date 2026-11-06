/**
 * The categories every new workspace starts with, copied from the server's sign-up trigger
 * (`handle_new_user` in moneymail `supabase/migrations/20260514000001_workspace_aggregates_and_signup.sql`):
 * 10 expense and 6 income, in the trigger's order. A guest's local workspace is seeded with them,
 * and they match the account's categories by name and type when guest data is uploaded.
 * `scripts/check-guest-store.ts` fails when this list drifts from the SQL.
 */
export type DefaultCategory = {
  name: string;
  type: 'expense' | 'income';
  /** Uppercase hex, as stored in `categories.color`. */
  color: string;
  /** `Ionicons/<name>`, as stored in `categories.icon`. */
  icon: string;
  is_default: true;
};

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  {
    name: 'Food & Drinks',
    type: 'expense',
    color: '#FF6B6B',
    icon: 'Ionicons/restaurant',
    is_default: true,
  },
  {
    name: 'Transportation',
    type: 'expense',
    color: '#4ECDC4',
    icon: 'Ionicons/car',
    is_default: true,
  },
  { name: 'Shopping', type: 'expense', color: '#FFE66D', icon: 'Ionicons/cart', is_default: true },
  {
    name: 'Bills & Utilities',
    type: 'expense',
    color: '#95E1D3',
    icon: 'Ionicons/flash',
    is_default: true,
  },
  {
    name: 'Entertainment',
    type: 'expense',
    color: '#DDA0DD',
    icon: 'Ionicons/game-controller',
    is_default: true,
  },
  { name: 'Health', type: 'expense', color: '#98D8C8', icon: 'Ionicons/medical', is_default: true },
  {
    name: 'Education',
    type: 'expense',
    color: '#F7DC6F',
    icon: 'Ionicons/school',
    is_default: true,
  },
  {
    name: 'Groceries',
    type: 'expense',
    color: '#82E0AA',
    icon: 'Ionicons/basket',
    is_default: true,
  },
  {
    name: 'Transfer',
    type: 'expense',
    color: '#AEB6BF',
    icon: 'Ionicons/swap-horizontal',
    is_default: true,
  },
  {
    name: 'Other',
    type: 'expense',
    color: '#D5DBDB',
    icon: 'Ionicons/ellipsis-horizontal',
    is_default: true,
  },
  {
    name: 'Salary',
    type: 'income',
    color: '#58D68D',
    icon: 'Ionicons/briefcase',
    is_default: true,
  },
  {
    name: 'Freelance',
    type: 'income',
    color: '#5DADE2',
    icon: 'Ionicons/laptop',
    is_default: true,
  },
  {
    name: 'Investment',
    type: 'income',
    color: '#F4D03F',
    icon: 'Ionicons/trending-up',
    is_default: true,
  },
  { name: 'Gift', type: 'income', color: '#EC7063', icon: 'Ionicons/gift', is_default: true },
  {
    name: 'Refund',
    type: 'income',
    color: '#AF7AC5',
    icon: 'Ionicons/arrow-undo',
    is_default: true,
  },
  {
    name: 'Other',
    type: 'income',
    color: '#AAB7B8',
    icon: 'Ionicons/ellipsis-horizontal',
    is_default: true,
  },
];
