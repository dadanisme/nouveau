import type { User } from '@supabase/supabase-js';

import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { getErrorCode, getErrorMessage } from '@/utils/error';

/** How the person confirms it's them before the account is deleted. */
export type ReauthProvider = 'apple' | 'google' | 'email';

/** `GET /api/account/deletion-preview` (moneymail): what deleting the account does. */
export type DeletionPreview = {
  /** Deleted outright: personal and solo-owned workspaces and the user's rows in them. */
  deleted: { workspaces: number; transactions: number; categories: number; receipts: number };
  /** Shared workspaces the user owns: ownership passes to the longest-standing member. */
  transfers: { workspaceId: string; workspaceName: string; newOwnerName: string }[];
  /** Shared workspaces where the user's rows are reassigned to the (new) owner. */
  handovers: {
    workspaceId: string;
    workspaceName: string;
    ownerName: string;
    transactions: number;
    categories: number;
    receipts: number;
  }[];
  /** `apple` when an Apple identity is linked, else the current session's provider. */
  reauthProvider: ReauthProvider;
};

/**
 * The re-authentication this device can do. Sign in with Apple is iOS-only here, so on Android an
 * Apple-linked account confirms with the session's own method instead: a password session
 * (`amr` `password`) with the password, any other with Google. Apple's tokens then aren't revoked.
 */
export function resolveReauthProvider(
  serverProvider: ReauthProvider,
  os: string,
  sessionMethods: readonly string[],
): ReauthProvider {
  if (serverProvider !== 'apple' || os === 'ios') return serverProvider;
  return sessionMethods.includes('password') ? 'email' : 'google';
}

/** The preview body, bare or in moneymail's `{ success, data }` envelope. */
export function unwrapPreview(
  body: DeletionPreview | { success: boolean; data: DeletionPreview },
): DeletionPreview {
  return 'data' in body && 'success' in body ? body.data : body;
}

/**
 * Whether the provider account that just signed in (its ID, and email for Google) is the one
 * linked to `user`. With no linked identity to compare, it's checked after signing in instead.
 */
export function isLinkedAccount(
  user: User,
  provider: 'apple' | 'google',
  providerUserId: string,
  email?: string,
): boolean {
  const identity = user.identities?.find((candidate) => candidate.provider === provider);
  const linkedId: unknown = identity?.identity_data?.sub ?? identity?.id;
  if (typeof linkedId === 'string' && linkedId) return linkedId === providerUserId;
  if (email && user.email) return email.toLowerCase() === user.email.toLowerCase();
  return true;
}

/** The re-authentication signed in to a different account than the one being deleted. */
export class AccountMismatchError extends Error {
  constructor() {
    super('Signed in with a different account');
    this.name = 'AccountMismatchError';
  }
}

/** "a", "a and b", "a, b and c". */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) {
    return i18n.t(k.deleteAccount.listTwo, { first: items[0], second: items[1] });
  }
  return i18n.t(k.deleteAccount.listThree, {
    first: items[0],
    second: items[1],
    third: items.slice(2).join(', '),
  });
}

type Counts = { transactions: number; categories: number; receipts: number };

/** "12 transactions and 1 category": the non-zero counts, pluralized. */
function formatCounts({ transactions, categories, receipts }: Counts): string {
  const parts: string[] = [];
  if (transactions) parts.push(i18n.t(k.deleteAccount.transactions, { count: transactions }));
  if (categories) parts.push(i18n.t(k.deleteAccount.categories, { count: categories }));
  if (receipts) parts.push(i18n.t(k.deleteAccount.receipts, { count: receipts }));
  return formatList(parts);
}

export type DeletedItem = 'profile' | 'workspaces' | 'transactions' | 'categories' | 'receipts';

/** What is deleted outright: the profile, then each non-zero count ("3 workspaces"). */
export function getDeletedRows(
  deleted: DeletionPreview['deleted'],
): { item: DeletedItem; title: string }[] {
  const rows: { item: DeletedItem; title: string }[] = [
    { item: 'profile', title: i18n.t(k.deleteAccount.profile) },
  ];
  (['workspaces', 'transactions', 'categories', 'receipts'] as const).forEach((item) => {
    const count = deleted[item];
    if (count > 0) rows.push({ item, title: i18n.t(k.deleteAccount[item], { count }) });
  });
  return rows;
}

export type WorkspaceChangeRow = { id: string; title: string; subtitle: string };

/**
 * One row per shared workspace the deletion changes: who becomes its owner, and what of the
 * user's stays there with the owner ("Alice becomes the owner. 12 transactions stay with Alice.").
 */
export function getWorkspaceChangeRows(preview: DeletionPreview): WorkspaceChangeRow[] {
  const rows = new Map<string, { title: string; lines: string[] }>();
  const rowFor = (id: string, name: string) => {
    let row = rows.get(id);
    if (!row) {
      row = { title: name, lines: [] };
      rows.set(id, row);
    }
    return row;
  };

  preview.transfers.forEach((transfer) => {
    rowFor(transfer.workspaceId, transfer.workspaceName).lines.push(
      i18n.t(k.deleteAccount.newOwner, { name: transfer.newOwnerName }),
    );
  });
  preview.handovers.forEach((handover) => {
    const items = formatCounts(handover);
    if (!items) return;
    rowFor(handover.workspaceId, handover.workspaceName).lines.push(
      i18n.t(k.deleteAccount.handover, { items, owner: handover.ownerName }),
    );
  });

  return [...rows].map(([id, row]) => ({ id, title: row.title, subtitle: row.lines.join(' ') }));
}

/** Checked by name: `instanceof` on Error subclasses isn't reliable after transpiling. */
function hasErrorName(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

/** The alert for a failed deletion: a specific title and message per cause. */
export function getDeletionErrorAlert(
  error: unknown,
  email: string | undefined,
): { title: string; message: string } {
  if (hasErrorName(error, 'AccountMismatchError')) {
    return {
      title: i18n.t(k.deleteAccount.wrongAccount),
      message: email
        ? i18n.t(k.deleteAccount.wrongAccountMessage, { email })
        : i18n.t(k.deleteAccount.wrongAccountMessageGeneric),
    };
  }
  if (getErrorCode(error) === 'invalid_credentials') {
    return {
      title: i18n.t(k.deleteAccount.incorrectPassword),
      message: i18n.t(k.deleteAccount.incorrectPasswordMessage),
    };
  }
  const failed = i18n.t(k.deleteAccount.failed);
  // An `ApiError` (`lib/api.ts`) from moneymail, whose `code` is the server's error string.
  if (hasErrorName(error, 'ApiError')) {
    const code = getErrorCode(error);
    if (code === 'reauth_required') {
      return { title: failed, message: i18n.t(k.deleteAccount.reauthRequiredMessage) };
    }
    if (code === 'apple_revoke_failed') {
      return { title: failed, message: i18n.t(k.deleteAccount.appleRevokeFailedMessage) };
    }
    // `delete_failed` and anything else the server reports.
    return { title: failed, message: i18n.t(k.deleteAccount.failedMessage) };
  }
  return { title: failed, message: getErrorMessage(error, i18n.t(k.common.unexpectedError)) };
}
