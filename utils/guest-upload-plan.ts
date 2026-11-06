import type { Tables, TablesInsert } from '@/types/supabase';

/**
 * The guest upload's plan (#100): how a guest's on-device data becomes rows in the account's
 * Personal workspace when they sign in. Pure, so `scripts/check-guest-upload.ts` tests it; the
 * executor is `lib/guest-upload.ts`.
 *
 * - Currency: the workspace adopts the guest's home currency when it holds no transaction yet,
 *   otherwise it keeps its own and the guest's rows are converted to it.
 * - Categories match the account's by type and name (`categoryKey`); the rest are created.
 * - Transactions keep their device ids, so re-sending them can't duplicate them.
 */

type WorkspaceRow = Tables<'workspaces'>;
type CategoryRow = Tables<'categories'>;
type TransactionRow = Tables<'transactions'>;

/** What the guest has on the device (`exportGuestData()` in `lib/local-db/queries.ts`). */
export interface GuestData {
  workspace: WorkspaceRow;
  categories: CategoryRow[];
  transactions: TransactionRow[];
}

/** The account side of the upload: its Personal workspace and what's already in it. */
export interface AccountData {
  userId: string;
  workspace: WorkspaceRow;
  hasTransactions: boolean;
  categories: CategoryRow[];
}

export interface GuestUploadPlan {
  /** The workspace's home currency after the upload. */
  targetCurrency: string;
  /** Write `targetCurrency` to the workspace (it held no transaction). */
  adoptCurrency: boolean;
  /** Guest categories with no match in the account, to insert. */
  categories: TablesInsert<'categories'>[];
  /** Device category id → the account category id the guest's transactions now use. */
  categoryIdMap: Record<string, string>;
  transactions: TablesInsert<'transactions'>[];
}

/** The largest `amount` the server takes: `numeric(12,2)`. */
export const MAX_AMOUNT = 9_999_999_999.99;

/** An amount the server column can't hold, caught before anything is written. */
export class AmountOverflowError extends Error {
  constructor(transactionId: string, amount: number) {
    super(`Transaction ${transactionId} has an amount (${amount}) over ${MAX_AMOUNT}`);
    this.name = 'AmountOverflowError';
  }
}

/** No exchange rate for a currency the guest's rows need converting from or to. */
export class MissingRateError extends Error {
  constructor(currency: string) {
    super(`No exchange rate for ${currency}`);
    this.name = 'MissingRateError';
  }
}

/** A category's identity across the device and the account: its type and its name, folded. */
export function categoryKey(type: string, name: string): string {
  return `${type}:${name.trim().normalize('NFC').toLowerCase()}`;
}

/** The workspace's currency after the upload: the guest's, unless the account already has data. */
export function chooseTargetCurrency(guest: GuestData, account: AccountData): string {
  return account.hasTransactions ? account.workspace.home_currency : guest.workspace.home_currency;
}

/** The currencies whose USD rates the plan needs (none when no row is converted). */
export function ratesNeeded(guest: GuestData, targetCurrency: string): string[] {
  const codes = new Set<string>();
  for (const transaction of guest.transactions) {
    if (transaction.home_currency === targetCurrency) continue;
    if (transaction.currency === targetCurrency) continue;
    codes.add(transaction.currency);
  }
  if (codes.size > 0) codes.add(targetCurrency);
  return [...codes].sort();
}

/** Rounds to cents, as `numeric(12,2)` does. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Oldest first; a missing `created_at` sorts last, then by id so the pick is stable. */
function byCreated(a: CategoryRow, b: CategoryRow): number {
  const at = a.created_at ?? '￿';
  const bt = b.created_at ?? '￿';
  if (at !== bt) return at < bt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Plans the upload. `usdRates` holds the latest `USD → code` rate per code (`ratesNeeded`); a
 * conversion uses `rate(a → b) = usd[b] / usd[a]`. Throws `AmountOverflowError` for an amount the
 * server can't hold and `MissingRateError` for a rate it needs and lacks, before anything is sent.
 */
export function planGuestUpload(args: {
  guest: GuestData;
  account: AccountData;
  usdRates: Record<string, number>;
}): GuestUploadPlan {
  const { guest, account, usdRates } = args;

  for (const transaction of guest.transactions) {
    if (Math.abs(transaction.amount) > MAX_AMOUNT) {
      throw new AmountOverflowError(transaction.id, transaction.amount);
    }
  }

  const targetCurrency = chooseTargetCurrency(guest, account);
  const usdRate = (code: string) => {
    const rate = code === 'USD' ? 1 : usdRates[code];
    if (!rate || !Number.isFinite(rate) || rate <= 0) throw new MissingRateError(code);
    return rate;
  };

  // The account's category per key: the oldest, when several share one.
  const accountByKey = new Map<string, string>();
  for (const category of [...account.categories].sort(byCreated)) {
    const key = categoryKey(category.type, category.name);
    if (!accountByKey.has(key)) accountByKey.set(key, category.id);
  }

  const categories: TablesInsert<'categories'>[] = [];
  const categoryIdMap: Record<string, string> = {};
  for (const category of [...guest.categories].sort(byCreated)) {
    const key = categoryKey(category.type, category.name);
    const match = accountByKey.get(key);
    if (match) {
      categoryIdMap[category.id] = match;
      continue;
    }
    // Created with its device id, so a retry finds it (and later guest rows with the same key
    // share it).
    categories.push({
      id: category.id,
      user_id: account.userId,
      workspace_id: account.workspace.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      is_default: false,
      created_at: category.created_at,
      updated_at: category.updated_at,
    });
    accountByKey.set(key, category.id);
    categoryIdMap[category.id] = category.id;
  }

  const transactions = guest.transactions.map((transaction): TablesInsert<'transactions'> => {
    const categoryId = categoryIdMap[transaction.category_id];
    if (!categoryId) throw new Error(`Transaction ${transaction.id} has no category`);

    let homeAmount = transaction.home_amount;
    if (transaction.home_currency !== targetCurrency) {
      homeAmount =
        transaction.currency === targetCurrency
          ? transaction.amount
          : round2((transaction.amount * usdRate(targetCurrency)) / usdRate(transaction.currency));
    }

    return {
      id: transaction.id,
      user_id: account.userId,
      workspace_id: account.workspace.id,
      category_id: categoryId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      home_amount: homeAmount,
      home_currency: targetCurrency,
      date: transaction.date,
      description: transaction.description,
      order_id: null,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };
  });

  return {
    targetCurrency,
    adoptCurrency: !account.hasTransactions,
    categories,
    categoryIdMap,
    transactions,
  };
}
