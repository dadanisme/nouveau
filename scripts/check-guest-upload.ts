/// <reference types="node" />
/**
 * Checks the guest upload (#100) without a device or a server:
 * - the planner (`utils/guest-upload-plan.ts`): category matching, adopt vs convert, conversions,
 *   a missing rate, no transactions, the amount overflow guard;
 * - the executor (`lib/guest-upload.ts`) on the real local store (`lib/local-db` on an in-memory
 *   `bun:sqlite`) and a fake server whose inserts skip ids already there (ON CONFLICT DO NOTHING):
 *   two runs leave the same server state, and a run that fails on a batch keeps the device data
 *   and the guest id, and its rerun completes with no duplicates.
 * Exits 1 on any failure.
 *
 *   bun scripts/check-guest-upload.ts
 */
import { Database } from 'bun:sqlite';
import { isDeepStrictEqual } from 'node:util';

import { createUploadServerFake, type FakeServer } from './fake-upload-server';
import { adaptBunSqlite } from './bun-sqlite-adapter';
import { runGuestUpload, type UploadLocal } from '../lib/guest-upload';
import { createLocalQueries, type LocalQueries } from '../lib/local-db/queries';
import { migrate, prepareConnection } from '../lib/local-db/schema';
import type { Tables } from '../types/supabase';
import {
  AmountOverflowError,
  categoryKey,
  MAX_AMOUNT,
  MissingRateError,
  planGuestUpload,
  ratesNeeded,
  type AccountData,
  type GuestData,
} from '../utils/guest-upload-plan';

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

function checkThrows(name: string, run: () => unknown, type: new (...args: never[]) => Error) {
  try {
    run();
    check(name, false, 'did not throw');
  } catch (error) {
    check(name, error instanceof type, String(error));
  }
}

async function checkRejects(name: string, run: () => Promise<unknown>, pattern?: RegExp) {
  try {
    await run();
    check(name, false, 'did not reject');
  } catch (error) {
    check(name, !pattern || pattern.test(String(error)), String(error));
  }
}

/** USD → code, as the `exchange_rates` table holds them. */
const USD_RATES: Record<string, number> = { IDR: 18148, EUR: 0.89509, JPY: 157.25, SGD: 1.2784 };

// --- Fixtures ---------------------------------------------------------------------------------

type CategoryRow = Tables<'categories'>;
type TransactionRow = Tables<'transactions'>;

function category(fields: Partial<CategoryRow> & Pick<CategoryRow, 'id' | 'name'>): CategoryRow {
  return {
    color: '#FF0000',
    created_at: '2026-11-01T00:00:00+00:00',
    icon: 'Ionicons/pricetag',
    is_default: true,
    type: 'expense',
    updated_at: '2026-11-01T00:00:00+00:00',
    user_id: 'guest',
    workspace_id: 'local-ws',
    ...fields,
  };
}

function transaction(
  fields: Partial<TransactionRow> & Pick<TransactionRow, 'id' | 'category_id' | 'amount'>,
): TransactionRow {
  return {
    created_at: '2026-11-02T10:00:00+00:00',
    currency: 'USD',
    date: '2026-11-02T00:00:00+00:00',
    description: null,
    home_amount: fields.amount,
    home_currency: 'USD',
    order_id: 'order-should-drop',
    type: 'expense',
    updated_at: '2026-11-03T10:00:00+00:00',
    user_id: 'guest',
    workspace_id: 'local-ws',
    ...fields,
  };
}

function guestData(
  categories: CategoryRow[],
  transactions: TransactionRow[],
  homeCurrency = 'USD',
): GuestData {
  return {
    workspace: {
      id: 'local-ws',
      name: 'Personal',
      owner_id: 'guest',
      home_currency: homeCurrency,
      is_personal: true,
      created_at: '2026-11-01T00:00:00+00:00',
      updated_at: '2026-11-01T00:00:00+00:00',
    },
    categories,
    transactions,
  };
}

function accountData(
  categories: CategoryRow[],
  hasTransactions: boolean,
  homeCurrency = 'IDR',
): AccountData {
  return {
    userId: 'user-1',
    hasTransactions,
    categories,
    workspace: {
      id: 'server-ws',
      name: 'Personal',
      owner_id: 'user-1',
      home_currency: homeCurrency,
      is_personal: true,
      created_at: '2026-01-01T00:00:00+00:00',
      updated_at: '2026-01-01T00:00:00+00:00',
    },
  };
}

// --- Planner ----------------------------------------------------------------------------------

function checkPlanner() {
  console.log('categoryKey');
  checkEqual(
    'folds case and outer spaces',
    categoryKey('expense', '  Food & Drink '),
    categoryKey('expense', 'food & drink'),
  );
  checkEqual(
    'folds Unicode composition (NFC)',
    categoryKey('expense', 'Café'),
    categoryKey('expense', 'Café'),
  );
  check('keeps the type apart', categoryKey('expense', 'Other') !== categoryKey('income', 'Other'));

  console.log('Categories');
  const account = accountData(
    [
      category({ id: 'a-food-new', name: 'Food', created_at: '2026-03-01T00:00:00+00:00' }),
      category({ id: 'a-food-old', name: 'food', created_at: '2026-02-01T00:00:00+00:00' }),
      category({ id: 'a-other-in', name: 'Other', type: 'income' }),
      category({ id: 'a-cafe', name: 'Café' }),
    ],
    false,
  );
  const guest = guestData(
    [
      category({ id: 'g-food', name: '  FOOD ' }),
      category({ id: 'g-other-ex', name: 'Other' }),
      category({ id: 'g-cafe', name: 'Café' }),
      category({
        id: 'g-pets',
        name: 'Pets',
        is_default: null,
        color: '#00AA00',
        icon: 'Ionicons/paw',
        created_at: '2026-11-04T00:00:00+00:00',
      }),
      category({ id: 'g-pets-2', name: 'pets', created_at: '2026-11-05T00:00:00+00:00' }),
    ],
    [
      transaction({ id: 't1', category_id: 'g-food', amount: 12.5 }),
      transaction({ id: 't2', category_id: 'g-pets-2', amount: 3 }),
    ],
  );
  const plan = planGuestUpload({ guest, account, usdRates: {} });
  checkEqual(
    'a name differing in case and spaces matches',
    plan.categoryIdMap['g-food'],
    'a-food-old',
  );
  checkEqual(
    'several matches: the earliest created wins',
    plan.categoryIdMap['g-food'],
    'a-food-old',
  );
  checkEqual('NFC-equal names match', plan.categoryIdMap['g-cafe'], 'a-cafe');
  checkEqual(
    'a same name of the other type does not match (created)',
    plan.categoryIdMap['g-other-ex'],
    'g-other-ex',
  );
  checkEqual(
    'unmatched categories are created with their device ids, once per key',
    plan.categories.map((row) => row.id),
    ['g-other-ex', 'g-pets'],
  );
  checkEqual(
    'a second guest category with the same key joins the first',
    plan.categoryIdMap['g-pets-2'],
    'g-pets',
  );
  checkEqual(
    'a created category: account user and workspace, is_default false, its own fields kept',
    plan.categories.find((row) => row.id === 'g-pets'),
    {
      id: 'g-pets',
      user_id: 'user-1',
      workspace_id: 'server-ws',
      name: 'Pets',
      type: 'expense',
      color: '#00AA00',
      icon: 'Ionicons/paw',
      is_default: false,
      created_at: '2026-11-04T00:00:00+00:00',
      updated_at: '2026-11-01T00:00:00+00:00',
    },
  );
  checkEqual(
    'transactions use the mapped category ids',
    plan.transactions.map((row) => row.category_id),
    ['a-food-old', 'g-pets'],
  );
  checkEqual(
    'a transaction keeps its id, amount, date and timestamps; takes the account ids; order_id null',
    plan.transactions[0],
    {
      id: 't1',
      user_id: 'user-1',
      workspace_id: 'server-ws',
      category_id: 'a-food-old',
      type: 'expense',
      amount: 12.5,
      currency: 'USD',
      home_amount: 12.5,
      home_currency: 'USD',
      date: '2026-11-02T00:00:00+00:00',
      description: null,
      order_id: null,
      created_at: '2026-11-02T10:00:00+00:00',
      updated_at: '2026-11-03T10:00:00+00:00',
    },
  );

  console.log('Currency');
  checkEqual(
    'adopt: an empty workspace takes the guest currency',
    [plan.adoptCurrency, plan.targetCurrency],
    [true, 'USD'],
  );
  checkEqual('adopt: no rates needed', ratesNeeded(guest, 'USD'), []);

  const mixed = guestData(
    [category({ id: 'g-food', name: 'Food' })],
    [
      transaction({ id: 'usd', category_id: 'g-food', amount: 10 }),
      transaction({
        id: 'eur',
        category_id: 'g-food',
        amount: 20,
        currency: 'EUR',
        home_amount: 22.34,
      }),
      transaction({
        id: 'idr',
        category_id: 'g-food',
        amount: 50000,
        currency: 'IDR',
        home_amount: 2.76,
      }),
      transaction({
        id: 'already',
        category_id: 'g-food',
        amount: 5,
        currency: 'SGD',
        home_amount: 70000,
        home_currency: 'IDR',
      }),
    ],
  );
  const busy = accountData([category({ id: 'a-food', name: 'Food' })], true, 'IDR');
  checkEqual(
    'convert: rates for the converted currencies and the target',
    ratesNeeded(mixed, 'IDR'),
    ['EUR', 'IDR', 'USD'],
  );
  const converted = planGuestUpload({ guest: mixed, account: busy, usdRates: USD_RATES });
  const homes = Object.fromEntries(
    converted.transactions.map((row) => [
      row.id,
      [row.amount, row.currency, row.home_amount, row.home_currency],
    ]),
  );
  checkEqual(
    'convert: an account with data keeps its currency',
    [converted.adoptCurrency, converted.targetCurrency],
    [false, 'IDR'],
  );
  checkEqual('convert: USD 10 → IDR at usd[IDR]/usd[USD]', homes.usd, [10, 'USD', 181480, 'IDR']);
  checkEqual('convert: EUR 20 → IDR at usd[IDR]/usd[EUR], rounded to cents', homes.eur, [
    20,
    'EUR',
    Math.round(((20 * 18148) / 0.89509) * 100) / 100,
    'IDR',
  ]);
  checkEqual('convert: a row in the target currency takes its amount', homes.idr, [
    50000,
    'IDR',
    50000,
    'IDR',
  ]);
  checkEqual('convert: a row already in the target home currency is unchanged', homes.already, [
    5,
    'SGD',
    70000,
    'IDR',
  ]);

  const adopt = accountData([], false, 'IDR');
  checkEqual('adopt: a row in another home currency needs SGD and USD', ratesNeeded(mixed, 'USD'), [
    'SGD',
    'USD',
  ]);
  const sameAdopt = planGuestUpload({ guest: mixed, account: adopt, usdRates: USD_RATES });
  checkEqual(
    'adopt: rows in the guest home currency keep their home amounts; another converts',
    sameAdopt.transactions.map((row) => [row.home_amount, row.home_currency]),
    [
      [10, 'USD'],
      [22.34, 'USD'],
      [2.76, 'USD'],
      [Math.round((5 / 1.2784) * 100) / 100, 'USD'],
    ],
  );

  checkThrows(
    'convert: a missing rate throws',
    () => planGuestUpload({ guest: mixed, account: busy, usdRates: { IDR: 18148 } }),
    MissingRateError,
  );
  checkThrows(
    'convert: a missing target rate throws',
    () => planGuestUpload({ guest: mixed, account: busy, usdRates: { EUR: 0.9 } }),
    MissingRateError,
  );

  console.log('Edges');
  const empty = planGuestUpload({
    guest: guestData([category({ id: 'g-food', name: 'Food' })], []),
    account: busy,
    usdRates: {},
  });
  checkEqual(
    'no transactions: nothing to send but the plan holds',
    [empty.transactions.length, empty.categories.length],
    [0, 0],
  );
  checkEqual('no transactions: no rates needed', ratesNeeded(guestData([], []), 'IDR'), []);

  const at = (amount: number) =>
    guestData(
      [category({ id: 'g-food', name: 'Food' })],
      [transaction({ id: 'big', category_id: 'g-food', amount })],
    );
  checkEqual(
    'the largest numeric(12,2) amount is accepted',
    planGuestUpload({ guest: at(MAX_AMOUNT), account: accountData([], false), usdRates: {} })
      .transactions.length,
    1,
  );
  checkThrows(
    'an amount over numeric(12,2) throws before anything',
    () =>
      planGuestUpload({ guest: at(10_000_000_000), account: accountData([], false), usdRates: {} }),
    AmountOverflowError,
  );
}

// --- Executor ---------------------------------------------------------------------------------

/** The guest's device: the local store on its own in-memory SQLite, and the stored guest id. */
interface Device {
  queries: LocalQueries;
  storage: Map<string, string>;
  local: UploadLocal;
  close(): void;
}

/** A device seeded the same way every time (ids from a counter): USD, 1 custom category, 7 rows. */
async function seededDevice(
  options: { transactions?: number; homeCurrency?: string } = {},
): Promise<Device> {
  const sqlite = new Database(':memory:');
  const db = adaptBunSqlite(sqlite);
  await prepareConnection(db);
  await migrate(db);
  let nextId = 0;
  const queries = createLocalQueries(
    db,
    () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}`,
  );
  const storage = new Map<string, string>();

  const { guestId, workspaceId } = await queries.seedGuestWorkspace({
    guestId: 'guest-1',
    homeCurrency: options.homeCurrency ?? 'USD',
  });
  storage.set('guest_user_id', guestId);
  const categories = await queries.getCategories(workspaceId);
  const food = categories.find((row) => row.type === 'expense')!;
  const customId = await queries.insertCategory({
    name: 'Board Games',
    type: 'expense',
    color: '#5856D6',
    icon: 'Ionicons/dice',
    user_id: guestId,
    workspace_id: workspaceId,
    // Fixed timestamps, so two devices seeded apart hold the same rows.
    created_at: '2026-11-01T07:00:00+00:00',
    updated_at: '2026-11-01T07:00:00+00:00',
  });
  const count = options.transactions ?? 7;
  for (let index = 0; index < count; index++) {
    await queries.insertTransaction({
      workspace_id: workspaceId,
      user_id: guestId,
      category_id: index % 2 ? customId : food.id,
      type: 'expense',
      amount: 10 + index,
      home_amount: 10 + index,
      currency: index === 0 ? 'EUR' : undefined,
      date: `2026-11-0${(index % 5) + 1}`,
      description: `row ${index}`,
      created_at: `2026-11-0${(index % 5) + 1}T08:00:0${index % 10}+00:00`,
      updated_at: `2026-11-0${(index % 5) + 1}T09:00:0${index % 10}+00:00`,
    });
  }

  return {
    queries,
    storage,
    local: {
      exportGuestData: () => queries.exportGuestData(),
      endGuest: async () => {
        await queries.eraseAll();
        storage.delete('guest_user_id');
      },
    },
    close: () => sqlite.close(),
  };
}

async function deviceCounts(device: Device) {
  const data = await device.queries.exportGuestData();
  return {
    categories: data?.categories.length ?? 0,
    transactions: data?.transactions.length ?? 0,
    guestId: device.storage.get('guest_user_id') ?? null,
  };
}

async function checkExecutor() {
  console.log('Export');
  const probe = await seededDevice();
  const exported = await probe.queries.exportGuestData();
  checkEqual(
    'exportGuestData: the workspace, 17 categories, 7 transactions',
    [exported?.workspace.home_currency, exported?.categories.length, exported?.transactions.length],
    ['USD', 17, 7],
  );
  check(
    'exportGuestData: booleans and amounts in the server shapes',
    exported?.workspace.is_personal === true &&
      exported.categories.every((row) => typeof row.is_default === 'boolean') &&
      exported.transactions.every((row) => typeof row.amount === 'number'),
  );
  probe.close();

  console.log('Adopt, run twice');
  const server = createUploadServerFake({ rates: USD_RATES, homeCurrency: 'IDR' });
  const first = await seededDevice();
  const uploaded = await runGuestUpload({ local: first.local, server, batchSize: 3 });
  checkEqual('resolves the uploaded count', uploaded, 7);
  checkEqual('the device is erased and the guest id gone', await deviceCounts(first), {
    categories: 0,
    transactions: 0,
    guestId: null,
  });
  checkEqual('3 batches of at most 3', server.batches, [3, 3, 1]);
  checkEqual('the empty workspace adopted USD', server.workspace.home_currency, 'USD');
  check('adopting bumped updated_at', server.workspace.updated_at !== server.workspace.created_at);
  checkEqual(
    'only the custom category was created (16 defaults matched), is_default false',
    server
      .categories()
      .filter((row) => row.user_id === server.userId && !row.is_default)
      .map((row) => row.name),
    ['Board Games'],
  );
  checkEqual('17 categories on the server', server.categories().length, 17);
  checkEqual('7 transactions on the server', server.transactions().length, 7);
  check(
    'every row is the account user’s in its Personal workspace',
    server
      .transactions()
      .every((row) => row.user_id === server.userId && row.workspace_id === server.workspace.id),
  );
  check(
    'the EUR row keeps its home amount in the adopted USD',
    server
      .transactions()
      .some(
        (row) => row.currency === 'EUR' && row.home_currency === 'USD' && row.home_amount === 10,
      ),
  );
  const afterFirst = server.snapshot();

  const second = await seededDevice();
  checkEqual(
    'a second run of the same device data resolves 7',
    await runGuestUpload({ local: second.local, server, batchSize: 3 }),
    7,
  );
  checkEqual('the second run leaves an identical server', server.snapshot(), afterFirst);
  first.close();
  second.close();

  console.log('Batch 2 fails, then the rerun');
  const flaky = createUploadServerFake({ rates: USD_RATES, homeCurrency: 'IDR', failOnBatch: 2 });
  const device = await seededDevice();
  const before = await deviceCounts(device);
  await checkRejects(
    'the run rejects',
    () => runGuestUpload({ local: device.local, server: flaky, batchSize: 3 }),
    /batch 2/,
  );
  checkEqual('the device data and the guest id are kept', await deviceCounts(device), before);
  checkEqual('the server holds batch 1 only', flaky.transactions().length, 3);
  flaky.failOnBatch = null;
  checkEqual(
    'the rerun resolves 7',
    await runGuestUpload({ local: device.local, server: flaky, batchSize: 3 }),
    7,
  );
  checkEqual(
    'the rerun leaves the same server as a clean run (no duplicates)',
    flaky.snapshot(),
    afterFirst,
  );
  checkEqual('then the device is erased', await deviceCounts(device), {
    categories: 0,
    transactions: 0,
    guestId: null,
  });
  device.close();

  console.log('Convert');
  const busy = createUploadServerFake({
    rates: USD_RATES,
    homeCurrency: 'IDR',
    existingTransactions: 2,
  });
  const usdDevice = await seededDevice({ transactions: 3 });
  checkEqual('resolves 3', await runGuestUpload({ local: usdDevice.local, server: busy }), 3);
  checkEqual('the workspace keeps IDR', busy.workspace.home_currency, 'IDR');
  checkEqual('rates asked for EUR, IDR and USD', busy.rateRequests, [['EUR', 'IDR', 'USD']]);
  const uploadedRows = busy.transactions().filter((row) => row.description?.startsWith('row '));
  checkEqual(
    'the uploaded rows are converted to IDR',
    uploadedRows
      .map((row) => [row.amount, row.currency, row.home_amount, row.home_currency])
      .sort(),
    [
      [10, 'EUR', Math.round(((10 * 18148) / 0.89509) * 100) / 100, 'IDR'],
      [11, 'USD', 11 * 18148, 'IDR'],
      [12, 'USD', 12 * 18148, 'IDR'],
    ].sort(),
  );
  checkEqual('5 transactions in all', busy.transactions().length, 5);
  usdDevice.close();

  console.log('Nothing to send');
  const missing = createUploadServerFake({
    rates: { IDR: 18148 },
    homeCurrency: 'IDR',
    existingTransactions: 1,
  });
  const noRate = await seededDevice({ transactions: 2 });
  const noRateBefore = await deviceCounts(noRate);
  await checkRejects(
    'a missing rate rejects',
    () => runGuestUpload({ local: noRate.local, server: missing }),
    /EUR/,
  );
  checkEqual(
    'a missing rate writes nothing',
    [missing.categories().length, missing.transactions().length],
    [16, 1],
  );
  checkEqual('a missing rate keeps the device data', await deviceCounts(noRate), noRateBefore);
  noRate.close();

  const zero = createUploadServerFake({ rates: USD_RATES, homeCurrency: 'IDR' });
  const zeroDevice = await seededDevice({ transactions: 0 });
  checkEqual(
    'no transactions resolves 0',
    await runGuestUpload({ local: zeroDevice.local, server: zero }),
    0,
  );
  checkEqual(
    'no transactions still adopts the currency and erases the device',
    [zero.workspace.home_currency, (await deviceCounts(zeroDevice)).guestId],
    ['USD', null],
  );
  zeroDevice.close();

  const bare = await seededDevice({ transactions: 0 });
  await bare.queries.eraseAll();
  const untouched: FakeServer = createUploadServerFake({ rates: USD_RATES, homeCurrency: 'IDR' });
  checkEqual(
    'no local workspace resolves 0',
    await runGuestUpload({ local: bare.local, server: untouched }),
    0,
  );
  checkEqual(
    'no local workspace only ends the guest',
    [bare.storage.get('guest_user_id') ?? null, untouched.workspace.home_currency, untouched.calls],
    [null, 'IDR', 0],
  );
  bare.close();
}

async function main() {
  checkPlanner();
  await checkExecutor();
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
