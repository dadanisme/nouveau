import { DEFAULT_CATEGORIES } from '../constants/default-categories';
import type { UploadServer } from '../lib/guest-upload';
import type { Tables, TablesInsert } from '../types/supabase';

type CategoryRow = Tables<'categories'>;
type TransactionRow = Tables<'transactions'>;

/**
 * An in-memory `UploadServer` for `check-guest-upload.ts`, shaped like the Supabase one: a new
 * account's Personal workspace with the sign-up trigger's categories, inserts that skip an id
 * already there (ON CONFLICT DO NOTHING), the RLS checks the inserts meet (the account's user, a
 * category in the same workspace), and a workspace update that bumps `updated_at`.
 */
export interface FakeServer extends UploadServer {
  workspace: Tables<'workspaces'>;
  categories(): CategoryRow[];
  transactions(): TransactionRow[];
  /** Everything an upload writes, for comparing two runs (`updated_at` of the workspace aside). */
  snapshot(): unknown;
  /** The sizes of the transaction batches that went in. */
  batches: number[];
  rateRequests: string[][];
  /** How many server calls were made. */
  calls: number;
  /** The 1-based transaction batch (counted over the server's life) that fails, or null. */
  failOnBatch: number | null;
}

const byId = <T extends { id: string }>(rows: Iterable<T>) =>
  [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function createUploadServerFake(options: {
  rates: Record<string, number>;
  homeCurrency: string;
  /** Transactions the account already has (in its first category). */
  existingTransactions?: number;
  failOnBatch?: number;
}): FakeServer {
  const userId = 'user-1';
  const created = '2026-01-01T00:00:00+00:00';
  const workspace: Tables<'workspaces'> = {
    id: 'server-ws',
    name: 'Personal',
    owner_id: userId,
    home_currency: options.homeCurrency,
    is_personal: true,
    created_at: created,
    updated_at: created,
  };
  const categories = new Map<string, CategoryRow>();
  DEFAULT_CATEGORIES.forEach((category, index) => {
    const id = `server-cat-${String(index).padStart(2, '0')}`;
    categories.set(id, {
      ...category,
      id,
      user_id: userId,
      workspace_id: workspace.id,
      created_at: created,
      updated_at: created,
    });
  });
  const transactions = new Map<string, TransactionRow>();
  for (let index = 0; index < (options.existingTransactions ?? 0); index++) {
    const id = `server-tx-${index}`;
    transactions.set(id, {
      id,
      user_id: userId,
      workspace_id: workspace.id,
      category_id: 'server-cat-00',
      type: 'expense',
      amount: 1000,
      home_amount: 1000,
      currency: options.homeCurrency,
      home_currency: options.homeCurrency,
      date: '2026-10-01T00:00:00+00:00',
      description: 'account row',
      order_id: null,
      created_at: created,
      updated_at: created,
    });
  }

  let batchNumber = 0;
  let clock = 0;

  const server: FakeServer = {
    userId,
    workspace,
    batches: [],
    rateRequests: [],
    calls: 0,
    failOnBatch: options.failOnBatch ?? null,

    categories: () => byId(categories.values()),
    transactions: () => byId(transactions.values()),
    snapshot: () => ({
      workspace: { ...workspace, updated_at: undefined },
      categories: server.categories(),
      transactions: server.transactions(),
    }),

    async getPersonalWorkspace() {
      server.calls++;
      return { ...workspace };
    },

    async hasTransactions(workspaceId) {
      server.calls++;
      return [...transactions.values()].some((row) => row.workspace_id === workspaceId);
    },

    async getCategories(workspaceId) {
      server.calls++;
      return server.categories().filter((row) => row.workspace_id === workspaceId);
    },

    async getUsdRates(codes) {
      server.calls++;
      server.rateRequests.push([...codes]);
      const rates: Record<string, number> = {};
      for (const code of codes) {
        const rate = code === 'USD' ? 1 : options.rates[code];
        if (rate) rates[code] = rate;
      }
      return rates;
    },

    async setHomeCurrency(workspaceId, currency) {
      server.calls++;
      if (workspaceId !== workspace.id) throw new Error('no such workspace');
      workspace.home_currency = currency;
      workspace.updated_at = `2026-11-06T00:00:${String(++clock).padStart(2, '0')}+00:00`;
    },

    async insertCategories(rows: TablesInsert<'categories'>[]) {
      server.calls++;
      for (const row of rows) {
        if (row.user_id !== userId) throw new Error('RLS: category user');
        if (row.workspace_id !== workspace.id) throw new Error('RLS: category workspace');
      }
      for (const row of rows) {
        const id = row.id!;
        if (categories.has(id)) continue;
        categories.set(id, {
          id,
          user_id: row.user_id,
          workspace_id: row.workspace_id!,
          name: row.name,
          type: row.type,
          color: row.color,
          icon: row.icon ?? null,
          is_default: row.is_default ?? false,
          created_at: row.created_at ?? created,
          updated_at: row.updated_at ?? created,
        });
      }
    },

    async insertTransactions(rows: TablesInsert<'transactions'>[]) {
      server.calls++;
      batchNumber++;
      if (server.failOnBatch === batchNumber) throw new Error(`batch ${batchNumber} failed`);
      for (const row of rows) {
        if (row.user_id !== userId) throw new Error('RLS: transaction user');
        const category = categories.get(row.category_id);
        if (!category || category.workspace_id !== row.workspace_id) {
          throw new Error('RLS: the category is not in the workspace');
        }
        if (Math.abs(row.amount) > 9_999_999_999.99) throw new Error('numeric field overflow');
      }
      for (const row of rows) {
        const id = row.id!;
        if (transactions.has(id)) continue;
        transactions.set(id, {
          id,
          user_id: row.user_id,
          workspace_id: row.workspace_id!,
          category_id: row.category_id,
          type: row.type,
          amount: row.amount,
          home_amount: row.home_amount,
          currency: row.currency ?? 'IDR',
          home_currency: row.home_currency ?? 'IDR',
          date: row.date,
          description: row.description ?? null,
          order_id: row.order_id ?? null,
          created_at: row.created_at ?? created,
          updated_at: row.updated_at ?? created,
        });
      }
      server.batches.push(rows.length);
    },
  };
  return server;
}
