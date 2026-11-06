import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchLatestUsdRates } from '@/lib/exchange-rates';
import type { Database, Tables, TablesInsert } from '@/types/supabase';
import {
  chooseTargetCurrency,
  planGuestUpload,
  ratesNeeded,
  type GuestData,
} from '@/utils/guest-upload-plan';

/**
 * The guest upload (#100): once a guest signs in, their on-device data goes into the account's
 * Personal workspace, then the device copy is erased. Every write is idempotent (device ids, and
 * inserts that skip a row already there), so a run that fails partway is simply run again (the
 * next launch), and the local copy goes only once every write has succeeded. No expo imports:
 * `scripts/check-guest-upload.ts` runs it on `bun:sqlite` and a fake server.
 */

type WorkspaceRow = Tables<'workspaces'>;
type CategoryRow = Tables<'categories'>;

/** About this many transactions per request. */
export const UPLOAD_BATCH_SIZE = 500;

/** The device side: the guest's data, and ending the guest (erase, then drop the guest id). */
export interface UploadLocal {
  exportGuestData(): Promise<GuestData | null>;
  endGuest(): Promise<void>;
}

/** The account side, for the signed-in user. Inserts skip rows whose id is already there. */
export interface UploadServer {
  userId: string;
  getPersonalWorkspace(): Promise<WorkspaceRow>;
  hasTransactions(workspaceId: string): Promise<boolean>;
  getCategories(workspaceId: string): Promise<CategoryRow[]>;
  /** The latest `USD → code` rate per code on or before `onOrBefore`; missing codes left out. */
  getUsdRates(codes: string[], onOrBefore: string): Promise<Record<string, number>>;
  setHomeCurrency(workspaceId: string, currency: string): Promise<void>;
  insertCategories(rows: TablesInsert<'categories'>[]): Promise<void>;
  insertTransactions(rows: TablesInsert<'transactions'>[]): Promise<void>;
}

/** Today on the device, `YYYY-MM-DD`. */
function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Uploads the guest's data and ends the guest. Resolves how many transactions were uploaded (0
 * when there was nothing). Throws on any failure, leaving the device data and the guest id in
 * place for the next attempt. `onWorkspace` gets the Personal workspace as soon as it's read, so
 * the app can make it the active one while the upload runs.
 */
export async function runGuestUpload(args: {
  local: UploadLocal;
  server: UploadServer;
  batchSize?: number;
  today?: string;
  onWorkspace?: (workspace: WorkspaceRow) => void | Promise<void>;
}): Promise<number> {
  const { local, server, batchSize = UPLOAD_BATCH_SIZE } = args;

  // 1. The device's data. A guest with no workspace has nothing to send.
  const guest = await local.exportGuestData();
  if (!guest) {
    await local.endGuest();
    return 0;
  }

  // 2. The account's Personal workspace and what's in it.
  const workspace = await server.getPersonalWorkspace();
  await args.onWorkspace?.(workspace);
  const [hasTransactions, categories] = await Promise.all([
    server.hasTransactions(workspace.id),
    server.getCategories(workspace.id),
  ]);
  const account = { userId: server.userId, workspace, hasTransactions, categories };
  const codes = ratesNeeded(guest, chooseTargetCurrency(guest, account));
  const usdRates =
    codes.length > 0 ? await server.getUsdRates(codes, args.today ?? localToday()) : {};

  // 3. The plan: it throws (an overflowing amount, a missing rate) before anything is written.
  const plan = planGuestUpload({ guest, account, usdRates });

  // 4. The currency first: once a transaction is in, the workspace no longer counts as empty, so
  //    a retry would convert instead of adopting.
  if (plan.adoptCurrency) await server.setHomeCurrency(workspace.id, plan.targetCurrency);

  // 5. The categories the transactions need.
  if (plan.categories.length > 0) await server.insertCategories(plan.categories);

  // 6. The transactions, in batches.
  for (let start = 0; start < plan.transactions.length; start += batchSize) {
    await server.insertTransactions(plan.transactions.slice(start, start + batchSize));
  }

  // 7. Everything is on the server: erase the device copy, then the guest.
  await local.endGuest();
  return plan.transactions.length;
}

/** `UploadServer` on Supabase, as `userId` (the client's signed-in user). */
export function createSupabaseUploadServer(
  client: SupabaseClient<Database>,
  userId: string,
): UploadServer {
  return {
    userId,

    async getPersonalWorkspace() {
      const { data, error } = await client
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_personal', true)
        .single();
      if (error) throw error;
      return data;
    },

    async hasTransactions(workspaceId) {
      const { data, error } = await client
        .from('transactions')
        .select('id')
        .eq('workspace_id', workspaceId)
        .limit(1);
      if (error) throw error;
      return data.length > 0;
    },

    async getCategories(workspaceId) {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data;
    },

    getUsdRates(codes, onOrBefore) {
      return fetchLatestUsdRates(client, codes, onOrBefore);
    },

    async setHomeCurrency(workspaceId, currency) {
      const { error } = await client
        .from('workspaces')
        .update({ home_currency: currency })
        .eq('id', workspaceId);
      if (error) throw error;
    },

    async insertCategories(rows) {
      const { error } = await client
        .from('categories')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    },

    async insertTransactions(rows) {
      const { error } = await client
        .from('transactions')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    },
  };
}
