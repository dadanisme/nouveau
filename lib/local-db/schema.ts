import type { SqlAdapter } from './adapter';

/**
 * The guest's on-device store: the columns of the `types/supabase.ts` Row types for workspaces,
 * categories and transactions, so local rows read back in the server's shapes (`queries.ts` maps
 * the 0/1 booleans). Dates and timestamps are ISO strings. Deleting a category deletes its
 * transactions, as on the server, which needs `PRAGMA foreign_keys = ON` on the connection.
 *
 * Each entry of `MIGRATIONS` moves the schema up one `PRAGMA user_version`; add new ones at the
 * end and never edit a shipped one.
 */
export const MIGRATIONS: readonly (readonly string[])[] = [
  // 1: workspaces, categories, transactions
  [
    `CREATE TABLE workspaces (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      home_currency TEXT NOT NULL DEFAULT 'IDR',
      is_personal INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE categories (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      color TEXT NOT NULL,
      icon TEXT,
      is_default INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`,
    `CREATE TABLE transactions (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      home_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      home_currency TEXT NOT NULL DEFAULT 'IDR',
      date TEXT NOT NULL,
      description TEXT,
      order_id TEXT,
      created_at TEXT,
      updated_at TEXT
    )`,
    'CREATE INDEX categories_workspace_id ON categories (workspace_id)',
    'CREATE INDEX transactions_workspace_id_date ON transactions (workspace_id, date)',
    'CREATE INDEX transactions_category_id ON transactions (category_id)',
  ],
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Brings the schema up to `SCHEMA_VERSION`, one transaction per migration. */
export async function migrate(db: SqlAdapter): Promise<void> {
  const row = await db.getFirst<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    await db.exclusiveTransaction(async (tx) => {
      for (const statement of MIGRATIONS[version - 1]) {
        await tx.run(statement);
      }
      // PRAGMA takes no bound parameters; `version` is a loop integer.
      await tx.run(`PRAGMA user_version = ${version}`);
    });
  }
}

/**
 * What every connection to the store runs once it's open, before any transaction starts (these
 * pragmas do nothing inside one):
 * - foreign keys on: SQLite turns them off per connection, and the category → transactions
 *   cascade relies on them;
 * - WAL and a busy timeout: an exclusive transaction runs on its own connection, so reads on the
 *   main one keep working and a write waits for it instead of failing with "database is locked".
 */
export async function prepareConnection(db: SqlAdapter): Promise<void> {
  await db.run('PRAGMA foreign_keys = ON');
  await db.run('PRAGMA journal_mode = WAL');
  await db.run('PRAGMA busy_timeout = 5000');
}
