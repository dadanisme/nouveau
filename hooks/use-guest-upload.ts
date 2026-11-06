import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { useWorkspace } from '@/contexts/workspace';
import { GUEST_SESSION_KEY, useGuestSession, useSession } from '@/hooks/use-auth';
import { endGuest } from '@/lib/guest';
import { createSupabaseUploadServer, runGuestUpload } from '@/lib/guest-upload';
import { showAlertDialog } from '@/lib/alert-dialog';
import i18n from '@/lib/i18n';
import { getLocalDb } from '@/lib/local-db';
import { supabase } from '@/lib/supabase';
import { k } from '@/locales/keys';

/** The query roots whose data the upload changes (the account's transactions and categories). */
const UPLOADED_DATA_KEYS = [
  'transactions',
  'transactions-year',
  'transaction',
  'recent-transactions',
  'balance',
  'monthly-totals',
  'workspace-balance',
  'workspace-monthly-totals',
  'categories',
  'category-transaction-count',
];

/** Long enough for the handover's fade (300 ms) to finish before the alert comes up. */
const NOTICE_DELAY_MS = 400;

// One upload at a time across mounts (and React's double effects in development).
let inFlight: { userId: string; promise: Promise<number> } | null = null;

function uploadOnce(userId: string, onWorkspace: (id: string) => Promise<void>): Promise<number> {
  if (inFlight?.userId === userId) return inFlight.promise;
  const promise = (async () => {
    const db = await getLocalDb();
    return runGuestUpload({
      local: { exportGuestData: () => db.exportGuestData(), endGuest },
      server: createSupabaseUploadServer(supabase, userId),
      onWorkspace: (workspace) => onWorkspace(workspace.id),
    });
  })().finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });
  inFlight = { userId, promise };
  return promise;
}

export interface GuestUpload {
  /**
   * A guest signed in and the first upload attempt for that sign-in hasn't finished: Login and
   * Signup stay open until it has (`useAuthRoutes`).
   */
  isUploading: boolean;
  /** How many transactions the last upload added, until the notice for it is shown. */
  uploadedCount: number | null;
  /** The notice was shown. */
  clearUploadedCount: () => void;
}

/**
 * Uploads a guest's on-device data once they sign in (#100), mounted once in the root layout.
 * Pending means a guest id and a session together: it runs once per sign-in (again after a
 * sign-out and sign-in, and on the next launch while it's still pending). It first makes the
 * account's Personal workspace the active one (the stored id is the device workspace's). On
 * success the account's data refetches, then the guest session clears, so the app never sees the
 * account without its uploaded rows. A failure is logged and leaves everything pending; the app
 * runs on the account meanwhile, and the next launch tries again.
 */
export function useGuestUpload(): GuestUpload {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const { guestId } = useGuestSession();
  const { switchWorkspace } = useWorkspace();
  const userId = session?.user.id ?? null;
  const pendingFor = userId && guestId ? userId : null;

  // The user whose attempt for this sign-in has finished; a sign-out resets it.
  const [finishedFor, setFinishedFor] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);
  if (!userId && finishedFor !== null) setFinishedFor(null);

  useEffect(() => {
    if (!pendingFor || finishedFor === pendingFor) return;
    let cancelled = false;

    uploadOnce(pendingFor, switchWorkspace)
      .then(async (count) => {
        await queryClient.refetchQueries({ queryKey: ['workspaces'], type: 'active' });
        queryClient.removeQueries({ queryKey: ['has-transactions'] });
        for (const key of UPLOADED_DATA_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
        // Last: the app now sees the account alone, with its workspaces already fresh, so the
        // new-account currency step can't mistake it for an untouched one.
        queryClient.setQueryData(GUEST_SESSION_KEY, null);
        if (cancelled) return;
        if (count > 0) setUploadedCount(count);
        setFinishedFor(pendingFor);
      })
      .catch((error) => {
        console.warn('Guest upload failed; it will retry on the next launch', error);
        if (!cancelled) setFinishedFor(pendingFor);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingFor, finishedFor, queryClient, switchWorkspace]);

  const clearUploadedCount = useCallback(() => setUploadedCount(null), []);

  return {
    isUploading: !!pendingFor && finishedFor !== pendingFor,
    uploadedCount,
    clearUploadedCount,
  };
}

/**
 * Tells the person their device's transactions are now in the account, once `isSettled` (the
 * handover to the tabs is over), a moment after so it doesn't land mid-transition. Nothing for 0.
 */
export function useGuestUploadNotice(upload: GuestUpload, isSettled: boolean) {
  const { uploadedCount, clearUploadedCount } = upload;

  useEffect(() => {
    if (uploadedCount === null || !isSettled) return;
    const timeout = setTimeout(() => {
      clearUploadedCount();
      showAlertDialog(
        i18n.t(k.guestUpload.title),
        i18n.t(k.guestUpload.message, { count: uploadedCount }),
      );
    }, NOTICE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [uploadedCount, isSettled, clearUploadedCount]);
}
