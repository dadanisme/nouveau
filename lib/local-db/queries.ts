import { DEFAULT_CATEGORIES } from '@/constants/default-categories';
import type { TransactionWithCategory, TransactionWithFullCategory } from '@/lib/data/types';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';

import type { SqlAdapter, SqlValue } from './adapter';

/**
 * The guest store's SQL, returning rows in the shapes the Supabase queries return, so the hooks
 * and utils can't tell local data from server data:
 * - `date` is a timestamptz-style ISO string (`YYYY-MM-DDT00:00:00+00:00`): utils split it on `T`;
 * - booleans are booleans (SQLite stores 0/1) and amounts are rounded to 2 decimals (numeric(12,2));
 * - a transaction list embeds a slim category and `receipt_proofs: [{ count: 0 }]` (guests have no
 *   proofs); a single transaction embeds the whole category row;
 * - transactions sort newest date first, then newest created; categories by name, ignoring case;
 * - `created_at` / `updated_at` are set on insert, and an update bumps `updated_at`.
 *
 * It takes a `SqlAdapter` and imports no expo module, so `scripts/check-guest-store.ts` runs it
 * on `bun:sqlite`.
 */

type WorkspaceRow = Tables<'workspaces'>;
type CategoryRow = Tables<'categories'>;
type TransactionRow = Tables<'transactions'>;

export const WORKSPACE_COLUMNS = [
  'created_at',
  'home_currency',
  'id',
  'is_personal',
  'name',
  'owner_id',
  'updated_at',
] as const satisfies readonly (keyof WorkspaceRow)[];

export const CATEGORY_COLUMNS = [
  'color',
  'created_at',
  'icon',
  'id',
  'is_default',
  'name',
  'type',
  'updated_at',
  'user_id',
  'workspace_id',
] as const satisfies readonly (keyof CategoryRow)[];

export const TRANSACTION_COLUMNS = [
  'amount',
  'category_id',
  'created_at',
  'currency',
  'date',
  'description',
  'home_amount',
  'home_currency',
  'id',
  'order_id',
  'type',
  'updated_at',
  'user_id',
  'workspace_id',
] as const satisfies readonly (keyof TransactionRow)[];

/** The category fields a transaction list embeds (`category:categories!category_id(...)`). */
const LIST_CATEGORY_COLUMNS = ['id', 'name', 'type', 'color', 'icon'] as const;

// Columns an update may change: never the id, and `updated_at` is set here.
const WORKSPACE_UPDATABLE = ['home_currency', 'is_personal', 'name', 'owner_id'] as const;
const CATEGORY_UPDATABLE = ['color', 'icon', 'is_default', 'name', 'type'] as const;
const TRANSACTION_UPDATABLE = [
  'amount',
  'category_id',
  'currency',
  'date',
  'description',
  'home_amount',
  'home_currency',
  'order_id',
  'type',
] as const;

/** The current time as Postgres prints a timestamptz in UTC (`…+00:00`). */
export function nowTimestamp(): string {
  return new Date().toISOString().replace('Z', '+00:00');
}

/** A transaction date as the server returns it: the day at UTC midnight (`YYYY-MM-DDT00:00:00+00:00`). */
export function toStoredDate(date: string): string {
  return `${date.split('T')[0]}T00:00:00+00:00`;
}

/** Rounds to cents, as `numeric(12,2)` does. */
export function roundAmount(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `[first day, first day of the next month)` for a 0-based month, as `YYYY-MM-DD`. */
export function monthRange(year: number, month: number): [string, string] {
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  return [`${year}-${pad(month + 1)}-01`, `${next.year}-${pad(next.month + 1)}-01`];
}

function toBool(value: unknown): boolean {
  return value === 1 || value === true;
}

function toNullableBool(value: unknown): boolean | null {
  return value === null || value === undefined ? null : toBool(value);
}

function fromBool(value: boolean | null | undefined): number | null {
  return value === null || value === undefined ? null : value ? 1 : 0;
}

type Raw = Record<string, unknown>;

function mapWorkspace(raw: Raw): WorkspaceRow {
  return {
    created_at: raw.created_at as string,
    home_currency: raw.home_currency as string,
    id: raw.id as string,
    is_personal: toBool(raw.is_personal),
    name: raw.name as string,
    owner_id: raw.owner_id as string,
    updated_at: raw.updated_at as string,
  };
}

function mapCategory(raw: Raw, prefix = ''): CategoryRow {
  return {
    color: raw[`${prefix}color`] as string,
    created_at: raw[`${prefix}created_at`] as string | null,
    icon: raw[`${prefix}icon`] as string | null,
    id: raw[`${prefix}id`] as string,
    is_default: toNullableBool(raw[`${prefix}is_default`]),
    name: raw[`${prefix}name`] as string,
    type: raw[`${prefix}type`] as string,
    updated_at: raw[`${prefix}updated_at`] as string | null,
    user_id: raw[`${prefix}user_id`] as string,
    workspace_id: raw[`${prefix}workspace_id`] as string,
  };
}

function mapTransaction(raw: Raw): TransactionRow {
  return {
    amount: raw.amount as number,
    category_id: raw.category_id as string,
    created_at: raw.created_at as string | null,
    currency: raw.currency as string,
    date: raw.date as string,
    description: raw.description as string | null,
    home_amount: raw.home_amount as number,
    home_currency: raw.home_currency as string,
    id: raw.id as string,
    order_id: raw.order_id as string | null,
    type: raw.type as string,
    updated_at: raw.updated_at as string | null,
    user_id: raw.user_id as string,
    workspace_id: raw.workspace_id as string,
  };
}

const TRANSACTION_SELECT = TRANSACTION_COLUMNS.map((column) => `t.${column}`).join(', ');
const LIST_CATEGORY_SELECT = LIST_CATEGORY_COLUMNS.map(
  (column) => `c.${column} AS c_${column}`,
).join(', ');
const FULL_CATEGORY_SELECT = CATEGORY_COLUMNS.map((column) => `c.${column} AS c_${column}`).join(
  ', ',
);
const TRANSACTION_ORDER = 'ORDER BY t.date DESC, t.created_at DESC';

function mapListTransaction(raw: Raw): TransactionWithCategory {
  return {
    ...mapTransaction(raw),
    category: {
      id: raw.c_id as string,
      name: raw.c_name as string,
      type: raw.c_type as string,
      color: raw.c_color as string,
      icon: raw.c_icon as string | null,
    },
    receipt_proofs: [{ count: 0 }],
  };
}

/** Builds `SET a = ?, b = ?, updated_at = ?` from the defined fields of `updates`. */
function buildSet(
  updates: Record<string, unknown>,
  columns: readonly string[],
  convert: (column: string, value: unknown) => SqlValue,
): { sql: string; params: SqlValue[] } {
  const assignments: string[] = [];
  const params: SqlValue[] = [];
  for (const column of columns) {
    if (!(column in updates) || updates[column] === undefined) continue;
    assignments.push(`${column} = ?`);
    params.push(convert(column, updates[column]));
  }
  assignments.push('updated_at = ?');
  params.push(nowTimestamp());
  return { sql: assignments.join(', '), params };
}

class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

export function createLocalQueries(db: SqlAdapter, newId: () => string) {
  async function getTransactionsBetween(
    workspaceId: string,
    start: string,
    end: string,
    type?: 'income' | 'expense',
  ): Promise<TransactionWithCategory[]> {
    const params: SqlValue[] = [workspaceId, start, end];
    let filter = '';
    if (type) {
      filter = ' AND t.type = ?';
      params.push(type);
    }
    const rows = await db.getAll<Raw>(
      `SELECT ${TRANSACTION_SELECT}, ${LIST_CATEGORY_SELECT}
       FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.workspace_id = ? AND t.date >= ? AND t.date < ?${filter}
       ${TRANSACTION_ORDER}`,
      params,
    );
    return rows.map(mapListTransaction);
  }

  async function insertCategoryRow(tx: SqlAdapter, category: TablesInsert<'categories'>) {
    const now = nowTimestamp();
    const id = category.id ?? newId();
    await tx.run(
      `INSERT INTO categories (id, workspace_id, user_id, name, type, color, icon, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        category.workspace_id,
        category.user_id,
        category.name,
        category.type,
        category.color,
        category.icon ?? null,
        fromBool(category.is_default ?? false),
        category.created_at ?? now,
        category.updated_at ?? now,
      ],
    );
    return id;
  }

  return {
    /** A 0-based month of a workspace, optionally one type. */
    getTransactionsForMonth(
      workspaceId: string,
      year: number,
      month: number,
      type?: 'income' | 'expense',
    ) {
      const [start, end] = monthRange(year, month);
      return getTransactionsBetween(workspaceId, start, end, type);
    },

    getTransactionsForYear(workspaceId: string, year: number) {
      return getTransactionsBetween(workspaceId, `${year}-01-01`, `${year + 1}-01-01`);
    },

    /** One transaction with its whole category row; throws when there is none (like `.single()`). */
    async getTransaction(id: string): Promise<TransactionWithFullCategory> {
      const raw = await db.getFirst<Raw>(
        `SELECT ${TRANSACTION_SELECT}, ${FULL_CATEGORY_SELECT}
         FROM transactions t JOIN categories c ON c.id = t.category_id
         WHERE t.id = ?`,
        [id],
      );
      if (!raw) throw new NotFoundError('Transaction');
      return { ...mapTransaction(raw), category: mapCategory(raw, 'c_') };
    },

    async insertTransaction(transaction: TablesInsert<'transactions'>): Promise<string> {
      const now = nowTimestamp();
      const id = transaction.id ?? newId();
      // A missing currency falls back to the workspace's (the server column defaults to IDR).
      await db.run(
        `INSERT INTO transactions (id, workspace_id, user_id, category_id, type, amount, home_amount,
           currency, home_currency, date, description, order_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?,
           COALESCE(?, (SELECT home_currency FROM workspaces WHERE id = ?), 'IDR'),
           COALESCE(?, (SELECT home_currency FROM workspaces WHERE id = ?), 'IDR'),
           ?, ?, ?, ?, ?)`,
        [
          id,
          transaction.workspace_id,
          transaction.user_id,
          transaction.category_id,
          transaction.type,
          roundAmount(transaction.amount),
          roundAmount(transaction.home_amount),
          transaction.currency ?? null,
          transaction.workspace_id,
          transaction.home_currency ?? null,
          transaction.workspace_id,
          toStoredDate(transaction.date),
          transaction.description ?? null,
          transaction.order_id ?? null,
          transaction.created_at ?? now,
          transaction.updated_at ?? now,
        ],
      );
      return id;
    },

    async updateTransaction(id: string, updates: TablesUpdate<'transactions'>): Promise<void> {
      const set = buildSet(updates, TRANSACTION_UPDATABLE, (column, value) => {
        if (column === 'amount' || column === 'home_amount') return roundAmount(value as number);
        if (column === 'date') return toStoredDate(value as string);
        return value as SqlValue;
      });
      await db.run(`UPDATE transactions SET ${set.sql} WHERE id = ?`, [...set.params, id]);
    },

    async deleteTransaction(id: string): Promise<void> {
      await db.run('DELETE FROM transactions WHERE id = ?', [id]);
    },

    async getCategories(workspaceId: string): Promise<CategoryRow[]> {
      const rows = await db.getAll<Raw>(
        `SELECT ${CATEGORY_COLUMNS.join(', ')} FROM categories
         WHERE workspace_id = ? ORDER BY name COLLATE NOCASE, type, created_at`,
        [workspaceId],
      );
      return rows.map((raw) => mapCategory(raw));
    },

    async countCategoryTransactions(categoryId: string): Promise<number> {
      const row = await db.getFirst<{ count: number }>(
        'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?',
        [categoryId],
      );
      return row?.count ?? 0;
    },

    insertCategory(category: TablesInsert<'categories'>): Promise<string> {
      return insertCategoryRow(db, category);
    },

    async updateCategory(id: string, updates: TablesUpdate<'categories'>): Promise<void> {
      const set = buildSet(updates, CATEGORY_UPDATABLE, (column, value) =>
        column === 'is_default' ? fromBool(value as boolean | null) : (value as SqlValue),
      );
      await db.run(`UPDATE categories SET ${set.sql} WHERE id = ?`, [...set.params, id]);
    },

    /** Deletes the category; its transactions go with it (`ON DELETE CASCADE`). */
    async deleteCategory(id: string): Promise<void> {
      await db.run('DELETE FROM categories WHERE id = ?', [id]);
    },

    /** The workspaces a user owns: personal first, then oldest first. */
    async getWorkspacesOwnedBy(userId: string): Promise<WorkspaceRow[]> {
      const rows = await db.getAll<Raw>(
        `SELECT ${WORKSPACE_COLUMNS.join(', ')} FROM workspaces
         WHERE owner_id = ? ORDER BY is_personal DESC, created_at ASC`,
        [userId],
      );
      return rows.map(mapWorkspace);
    },

    /** One workspace; throws when there is none (like `.single()`). */
    async getWorkspace(id: string): Promise<WorkspaceRow> {
      const raw = await db.getFirst<Raw>(
        `SELECT ${WORKSPACE_COLUMNS.join(', ')} FROM workspaces WHERE id = ?`,
        [id],
      );
      if (!raw) throw new NotFoundError('Workspace');
      return mapWorkspace(raw);
    },

    async updateWorkspace(id: string, updates: TablesUpdate<'workspaces'>): Promise<void> {
      const set = buildSet(updates, WORKSPACE_UPDATABLE, (column, value) =>
        column === 'is_personal' ? fromBool(value as boolean) : (value as SqlValue),
      );
      await db.run(`UPDATE workspaces SET ${set.sql} WHERE id = ?`, [...set.params, id]);
    },

    /**
     * The guest's Personal workspace with the default categories, created once. Idempotent: the
     * device keeps one guest, so an existing personal workspace (from an earlier, interrupted
     * start) is reused with its owner as the guest id, and its categories are only added when it
     * has none. Runs in one exclusive transaction.
     */
    seedGuestWorkspace(args: {
      guestId: string;
      homeCurrency: string;
    }): Promise<{ guestId: string; workspaceId: string }> {
      return db.exclusiveTransaction(async (tx) => {
        let workspace = await tx.getFirst<{ id: string; owner_id: string }>(
          'SELECT id, owner_id FROM workspaces WHERE is_personal = 1 ORDER BY created_at LIMIT 1',
        );
        if (!workspace) {
          const now = nowTimestamp();
          workspace = { id: newId(), owner_id: args.guestId };
          await tx.run(
            `INSERT INTO workspaces (id, name, owner_id, home_currency, is_personal, created_at, updated_at)
             VALUES (?, 'Personal', ?, ?, 1, ?, ?)`,
            [workspace.id, workspace.owner_id, args.homeCurrency, now, now],
          );
        }

        const existing = await tx.getFirst<{ count: number }>(
          'SELECT COUNT(*) AS count FROM categories WHERE workspace_id = ?',
          [workspace.id],
        );
        if (!existing?.count) {
          for (const category of DEFAULT_CATEGORIES) {
            await insertCategoryRow(tx, {
              ...category,
              user_id: workspace.owner_id,
              workspace_id: workspace.id,
            });
          }
        }

        return { guestId: workspace.owner_id, workspaceId: workspace.id };
      });
    },

    /** Deletes every local row. */
    eraseAll(): Promise<void> {
      return db.exclusiveTransaction(async (tx) => {
        await tx.run('DELETE FROM transactions');
        await tx.run('DELETE FROM categories');
        await tx.run('DELETE FROM workspaces');
      });
    },
  };
}

export type LocalQueries = ReturnType<typeof createLocalQueries>;
