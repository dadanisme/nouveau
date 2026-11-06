/// <reference types="node" />
/**
 * Checks the guest store (#100) without a device: runs `lib/local-db` (schema + queries) on an
 * in-memory `bun:sqlite` database through the same adapter interface the app uses, and checks the
 * rows against the server's shapes. Exits 1 on any failure.
 *
 *   bun scripts/check-guest-store.ts
 *
 * The default categories are compared with the server's sign-up trigger in the moneymail repo,
 * found next to this repo (`../moneymail`, also from a git worktree) or at `$MONEYMAIL_DIR`.
 */
import { Database } from 'bun:sqlite';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { DEFAULT_CATEGORIES } from '../constants/default-categories';
import type { SqlAdapter, SqlValue } from '../lib/local-db/adapter';
import { createLocalQueries } from '../lib/local-db/queries';
import { migrate, prepareConnection, SCHEMA_VERSION } from '../lib/local-db/schema';

const ROOT = path.resolve(__dirname, '..');
const SIGNUP_MIGRATION = 'supabase/migrations/20260514000001_workspace_aggregates_and_signup.sql';

const failures: string[] = [];
let passed = 0;

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failures.push(name);
    console.log(
      `  FAIL  ${name}${detail === undefined ? '' : `\n        ${JSON.stringify(detail)}`}`,
    );
  }
}

function checkEqual(name: string, actual: unknown, expected: unknown) {
  check(name, isDeepStrictEqual(actual, expected), { actual, expected });
}

// --- Inputs from outside this repo ------------------------------------------------------------

function findMoneymail(): string | null {
  const candidates = [process.env.MONEYMAIL_DIR, path.resolve(ROOT, '../moneymail')];
  try {
    // In a git worktree, the main checkout sits next to moneymail.
    const commonDir = execSync('git rev-parse --path-format=absolute --git-common-dir', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    candidates.push(path.resolve(path.dirname(commonDir), '../moneymail'));
  } catch {
    // Not a git checkout: rely on the other candidates.
  }
  for (const dir of candidates) {
    if (dir && existsSync(path.join(dir, SIGNUP_MIGRATION))) return dir;
  }
  return null;
}

/** The `(new.id, new_workspace_id, name, type, color, icon, is_default)` rows of the trigger. */
function parseSignupCategories(sql: string) {
  const start = sql.indexOf('FUNCTION public.handle_new_user');
  const body = start === -1 ? sql : sql.slice(start);
  const row =
    /\(\s*new\.id\s*,\s*new_workspace_id\s*,\s*'((?:[^']|'')*)'\s*,\s*'(expense|income)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(true|false)\s*\)/g;
  return [...body.matchAll(row)].map((match) => ({
    name: match[1].replace(/''/g, "'"),
    type: match[2],
    color: match[3],
    icon: match[4],
    is_default: match[5] === 'true',
  }));
}

/** The keys of `<table>.Row` in `types/supabase.ts` (the server's generated row type). */
function serverRowKeys(table: string): string[] {
  const types = readFileSync(path.join(ROOT, 'types/supabase.ts'), 'utf8');
  const match = new RegExp(`\\n      ${table}: \\{\\n        Row: \\{([^}]*)\\}`).exec(types);
  if (!match) throw new Error(`No ${table}.Row in types/supabase.ts`);
  return [...match[1].matchAll(/^\s*(\w+)\??:/gm)].map((key) => key[1]).sort();
}

// --- bun:sqlite adapter -----------------------------------------------------------------------

function adapt(db: Database): SqlAdapter {
  const adapter: SqlAdapter = {
    async run(sql: string, params: SqlValue[] = []) {
      db.query(sql).run(...params);
    },
    async getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.query(sql).all(...params) as T[];
    },
    async getFirst<T>(sql: string, params: SqlValue[] = []) {
      return (db.query(sql).get(...params) ?? null) as T | null;
    },
    async exclusiveTransaction<T>(task: (tx: SqlAdapter) => Promise<T>) {
      db.run('BEGIN EXCLUSIVE');
      try {
        const result = await task(adapter);
        db.run('COMMIT');
        return result;
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    },
  };
  return adapter;
}

const sortedKeys = (row: object) => Object.keys(row).sort();

// --- Checks -----------------------------------------------------------------------------------

async function main() {
  console.log('Default categories');
  const moneymail = findMoneymail();
  check(`moneymail checkout found (${SIGNUP_MIGRATION})`, moneymail !== null, {
    looked: ['$MONEYMAIL_DIR', '../moneymail', '<main checkout>/../moneymail'],
  });
  if (moneymail) {
    const sqlRows = parseSignupCategories(
      readFileSync(path.join(moneymail, SIGNUP_MIGRATION), 'utf8'),
    );
    checkEqual('the SQL has 16 category rows', sqlRows.length, 16);
    checkEqual(
      'DEFAULT_CATEGORIES equals the SQL VALUES rows, in order',
      DEFAULT_CATEGORIES.map((category) => ({ ...category })),
      sqlRows,
    );
  }

  const sqlite = new Database(':memory:');
  const db = adapt(sqlite);
  await prepareConnection(db);
  await migrate(db);
  await migrate(db);

  let nextId = 0;
  const q = createLocalQueries(db, () => `id-${++nextId}`);

  console.log('Schema');
  const version = await db.getFirst<{ user_version: number }>('PRAGMA user_version');
  checkEqual(
    'user_version is the schema version after migrating twice',
    version?.user_version,
    SCHEMA_VERSION,
  );
  const fk = await db.getFirst<{ foreign_keys: number }>('PRAGMA foreign_keys');
  checkEqual('foreign keys are on', fk?.foreign_keys, 1);

  console.log('Seed');
  const first = await q.seedGuestWorkspace({ guestId: 'guest-1', homeCurrency: 'USD' });
  const second = await q.seedGuestWorkspace({ guestId: 'guest-2', homeCurrency: 'EUR' });
  checkEqual('seeding twice returns the same guest and workspace', second, first);
  const workspaces = await q.getWorkspacesOwnedBy('guest-1');
  checkEqual('one workspace', workspaces.length, 1);
  const workspace = workspaces[0];
  checkEqual(
    'workspace keys equal the server Row keys',
    sortedKeys(workspace),
    serverRowKeys('workspaces'),
  );
  checkEqual(
    'workspace is Personal, personal (a boolean), owned by the guest, in the home currency',
    [workspace.name, workspace.is_personal, workspace.owner_id, workspace.home_currency],
    ['Personal', true, 'guest-1', 'USD'],
  );
  const categories = await q.getCategories(workspace.id);
  checkEqual('16 categories', categories.length, 16);
  checkEqual(
    '10 expense and 6 income',
    [
      categories.filter((c) => c.type === 'expense').length,
      categories.filter((c) => c.type === 'income').length,
    ],
    [10, 6],
  );
  checkEqual(
    'category keys equal the server Row keys',
    sortedKeys(categories[0]),
    serverRowKeys('categories'),
  );
  check(
    'seeded categories are is_default true (a boolean) and owned by the guest',
    categories.every((c) => c.is_default === true && c.user_id === 'guest-1'),
  );

  await q.insertCategory({
    name: 'apple stand',
    type: 'expense',
    color: '#000000',
    user_id: 'guest-1',
    workspace_id: workspace.id,
  });
  const names = (await q.getCategories(workspace.id)).map((c) => c.name);
  checkEqual(
    'categories sort by name, ignoring case',
    names,
    [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  );
  checkEqual(
    'a new category defaults to is_default false',
    (await q.getCategories(workspace.id))[0].is_default,
    false,
  );

  console.log('Transactions');
  const food = categories.find((c) => c.name === 'Food & Drinks')!;
  const salary = categories.find((c) => c.name === 'Salary')!;
  const base = { user_id: 'guest-1', workspace_id: workspace.id };
  checkEqual(
    'hasTransactions is false for a fresh workspace',
    await q.hasTransactions(workspace.id),
    false,
  );
  const nov30 = await q.insertTransaction({
    ...base,
    category_id: food.id,
    type: 'expense',
    amount: 12.345,
    home_amount: 12.345,
    date: '2026-11-30',
    created_at: '2026-11-30T08:00:00.000+00:00',
  });
  const nov30Later = await q.insertTransaction({
    ...base,
    category_id: salary.id,
    type: 'income',
    amount: 5000,
    home_amount: 5000,
    date: '2026-11-30',
    description: 'Pay',
    created_at: '2026-11-30T09:00:00.000+00:00',
  });
  const nov1 = await q.insertTransaction({
    ...base,
    category_id: food.id,
    type: 'expense',
    amount: 3,
    home_amount: 3,
    date: '2026-11-01T00:00:00+00:00',
    updated_at: '2000-01-01T00:00:00.000+00:00',
  });
  const dec1 = await q.insertTransaction({
    ...base,
    category_id: food.id,
    type: 'expense',
    amount: 7,
    home_amount: 7,
    date: '2026-12-01',
  });
  const dec31 = await q.insertTransaction({
    ...base,
    category_id: food.id,
    type: 'expense',
    amount: 1,
    home_amount: 1,
    date: '2026-12-31',
  });
  await q.insertTransaction({
    ...base,
    category_id: food.id,
    type: 'expense',
    amount: 1,
    home_amount: 1,
    date: '2027-01-01',
  });

  const november = await q.getTransactionsForMonth(workspace.id, 2026, 10);
  checkEqual(
    'November: Nov 30 (newest created first), then Nov 1',
    november.map((t) => t.id),
    [nov30Later, nov30, nov1],
  );
  const december = await q.getTransactionsForMonth(workspace.id, 2026, 11);
  checkEqual(
    'December: Dec 31, Dec 1 (Nov 30 and Jan 1 excluded)',
    december.map((t) => t.id),
    [dec31, dec1],
  );
  const novIncome = await q.getTransactionsForMonth(workspace.id, 2026, 10, 'income');
  checkEqual(
    'type filter: November income',
    novIncome.map((t) => t.id),
    [nov30Later],
  );
  const novExpense = await q.getTransactionsForMonth(workspace.id, 2026, 10, 'expense');
  checkEqual(
    'type filter: November expense',
    novExpense.map((t) => t.id),
    [nov30, nov1],
  );
  const year = await q.getTransactionsForYear(workspace.id, 2026);
  checkEqual(
    'the year 2026 holds 5 (not Jan 1 2027), newest first',
    year.map((t) => t.id),
    [dec31, dec1, nov30Later, nov30, nov1],
  );

  checkEqual('hasTransactions is true once one is added', await q.hasTransactions(workspace.id), true);
  checkEqual(
    'hasTransactions is false for another workspace',
    await q.hasTransactions('other-workspace'),
    false,
  );

  const listed = november[1];
  checkEqual(
    'list row keys equal the server Row keys + category + receipt_proofs',
    sortedKeys(listed),
    [...serverRowKeys('transactions'), 'category', 'receipt_proofs'].sort(),
  );
  checkEqual('list category embeds id, name, type, color, icon', sortedKeys(listed.category), [
    'color',
    'icon',
    'id',
    'name',
    'type',
  ]);
  checkEqual('receipt_proofs is [{ count: 0 }]', listed.receipt_proofs, [{ count: 0 }]);
  checkEqual(
    'date is stored as a timestamptz ISO string',
    listed.date,
    '2026-11-30T00:00:00+00:00',
  );
  checkEqual("date.split('T')[0] round-trips", listed.date.split('T')[0], '2026-11-30');
  checkEqual('an ISO date input keeps its day', november[2].date.split('T')[0], '2026-11-01');
  checkEqual(
    'amounts are rounded to 2 decimals',
    [listed.amount, listed.home_amount],
    [12.35, 12.35],
  );
  checkEqual(
    'currencies fall back to the workspace home currency',
    [listed.currency, listed.home_currency],
    ['USD', 'USD'],
  );

  const single = await q.getTransaction(nov30);
  checkEqual(
    'single row keys equal the server Row keys + category',
    sortedKeys(single),
    [...serverRowKeys('transactions'), 'category'].sort(),
  );
  checkEqual('single row embeds the whole category row', single.category, food);
  let missingThrows = false;
  try {
    await q.getTransaction('missing');
  } catch {
    missingThrows = true;
  }
  check('a missing transaction throws (like .single())', missingThrows);

  console.log('Updates');
  const before = await q.getTransaction(nov1);
  await q.updateTransaction(nov1, { description: 'Edited', amount: 4.999, date: '2026-11-02' });
  const after = await q.getTransaction(nov1);
  check('an update bumps updated_at', (after.updated_at ?? '') > (before.updated_at ?? ''), {
    before: before.updated_at,
    after: after.updated_at,
  });
  checkEqual(
    'an update writes the fields, rounded and normalized',
    [after.description, after.amount, after.date, after.created_at],
    ['Edited', 5, '2026-11-02T00:00:00+00:00', before.created_at],
  );
  const workspaceBefore = await q.getWorkspace(workspace.id);
  await q.updateWorkspace(workspace.id, { name: 'Home', home_currency: 'IDR' });
  const workspaceAfter = await q.getWorkspace(workspace.id);
  checkEqual(
    'a workspace update writes the fields',
    [workspaceAfter.name, workspaceAfter.home_currency],
    ['Home', 'IDR'],
  );
  check(
    'a workspace update keeps updated_at at or after the old one',
    workspaceAfter.updated_at >= workspaceBefore.updated_at,
  );

  console.log('Deletes');
  checkEqual('Food & Drinks holds 5 transactions', await q.countCategoryTransactions(food.id), 5);
  await q.deleteCategory(food.id);
  checkEqual(
    'deleting the category deletes its transactions (FK cascade)',
    await q.countCategoryTransactions(food.id),
    0,
  );
  checkEqual(
    'only the other category’s transaction is left',
    (await q.getTransactionsForYear(workspace.id, 2026)).map((t) => t.id),
    [nov30Later],
  );
  await q.deleteTransaction(nov30Later);
  checkEqual(
    'deleteTransaction removes it',
    (await q.getTransactionsForYear(workspace.id, 2026)).length,
    0,
  );
  checkEqual(
    'hasTransactions is false again once all are deleted',
    await q.hasTransactions(workspace.id),
    false,
  );

  await q.eraseAll();
  const left = await db.getFirst<{ count: number }>(
    'SELECT (SELECT COUNT(*) FROM workspaces) + (SELECT COUNT(*) FROM categories) + (SELECT COUNT(*) FROM transactions) AS count',
  );
  checkEqual('eraseAll leaves no rows', left?.count, 0);

  sqlite.close();
}

main()
  .catch((error) => {
    failures.push(`threw: ${error instanceof Error ? error.stack : String(error)}`);
    console.log(`  FAIL  ${failures[failures.length - 1]}`);
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failures.length} failed`);
    process.exit(failures.length ? 1 : 0);
  });
