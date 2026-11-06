import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

/**
 * Where the data hooks read and write: Supabase for a signed-in account (`remote.ts`), the
 * on-device store for a guest (`local.ts`). Both return the same row shapes, so the hooks keep
 * one query key, `enabled` rule and invalidation each, whichever source answers.
 * `useDataSource()` (`hooks/use-data-source.ts`) picks one.
 */

export type TransactionWithCategory = Tables<'transactions'> & {
  category: Pick<Tables<'categories'>, 'id' | 'name' | 'type' | 'color' | 'icon'>;
  /** Supabase aggregate count from `receipt_proofs(count)` join — always a single-element tuple */
  receipt_proofs: [{ count: number }];
};

/** A transaction with its whole category row (`category:categories(*)`). */
export type TransactionWithFullCategory = Tables<'transactions'> & {
  category: Tables<'categories'>;
};

export type TransactionType = 'income' | 'expense';

/** Thrown by the local source for what needs an account (creating or deleting a workspace). */
export class SignInRequiredError extends Error {
  constructor(message = 'Sign in to use this feature.') {
    super(message);
    this.name = 'SignInRequiredError';
  }
}

export interface DataSource {
  kind: 'remote' | 'local';

  /** A 0-based month of a workspace, newest first, optionally one type. */
  getTransactions(
    workspaceId: string,
    year: number,
    month: number,
    type?: TransactionType,
  ): Promise<TransactionWithCategory[]>;
  getTransactionsByYear(workspaceId: string, year: number): Promise<TransactionWithCategory[]>;
  getTransaction(id: string): Promise<TransactionWithFullCategory>;
  addTransaction(transaction: TablesInsert<'transactions'>): Promise<void>;
  updateTransaction(id: string, updates: TablesUpdate<'transactions'>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  getCategories(workspaceId: string): Promise<Tables<'categories'>[]>;
  /** How many transactions deleting the category would also delete. */
  countCategoryTransactions(categoryId: string): Promise<number>;
  addCategory(category: TablesInsert<'categories'>): Promise<void>;
  updateCategory(id: string, updates: TablesUpdate<'categories'>): Promise<void>;
  /** Deletes the category and its transactions. */
  deleteCategory(id: string): Promise<void>;

  /** The user's workspaces: personal first, then oldest first. */
  getMyWorkspaces(userId: string): Promise<Tables<'workspaces'>[]>;
  getWorkspace(id: string): Promise<Tables<'workspaces'>>;
  /** Resolves the new workspace's id. */
  createWorkspace(args: { name: string; home_currency?: string }): Promise<string>;
  updateWorkspace(id: string, updates: TablesUpdate<'workspaces'>): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
}
