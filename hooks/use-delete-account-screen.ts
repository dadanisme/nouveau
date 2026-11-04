import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useDeleteAccount, useDeletionPreview } from '@/hooks/use-account-deletion';
import { useSession } from '@/hooks/use-auth';
import { showAlertDialog } from '@/lib/alert-dialog';
import { confirmDestructive } from '@/lib/confirm-destructive';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import {
  getDeletedRows,
  getDeletionErrorAlert,
  getWorkspaceChangeRows,
} from '@/utils/account-deletion';

/**
 * Screen hook for Delete Account (pushed from Settings): the preview of what's deleted and what
 * passes to other members, the password for email accounts, and the delete itself, confirmed
 * with an action sheet (an M3 dialog on Android). A dismissed Google or Apple sheet leaves the
 * person on the screen with no alert; every failure shows one. Once the account is deleted the
 * app is on Login and an alert says so (HIG managing-accounts#Deleting-accounts: "notify them
 * when it's finished").
 */
export function useDeleteAccountScreen() {
  const { t } = useLanguage();
  const { session } = useSession();
  const email = session?.user.email;
  const preview = useDeletionPreview();
  const [password, setPassword] = useState('');
  const deleteAccount = useDeleteAccount({
    onDeleted: () =>
      showAlertDialog(i18n.t(k.deleteAccount.deleted), i18n.t(k.deleteAccount.deletedMessage)),
  });

  const data = preview.data;
  const provider = data?.reauthProvider;
  const needsPassword = provider === 'email';
  const isDeleting = deleteAccount.isPending;
  const canDelete = !!data && !isDeleting && (!needsPassword || password.length > 0);

  function confirmDelete() {
    if (!provider || !canDelete) return;
    confirmDestructive({
      // The red button says what happens; Android's dialog asks it as a question.
      dialogTitle: t(k.deleteAccount.prompt),
      confirmLabel: t(k.deleteAccount.title),
      onConfirm: () =>
        deleteAccount.mutate(
          { provider, password },
          {
            onError: (error) => {
              const alert = getDeletionErrorAlert(error, email);
              showAlertDialog(alert.title, alert.message);
            },
          },
        ),
    });
  }

  const confirmFooter =
    provider === 'google'
      ? t(k.deleteAccount.confirmWithGoogle)
      : provider === 'apple'
        ? t(k.deleteAccount.confirmWithApple)
        : undefined;

  return {
    /** The first load: a progress row instead of the form. */
    isLoading: preview.isLoading,
    /** The preview failed and there's nothing to show: a notice with Try Again. */
    hasError: preview.isError && !data,
    isRetrying: preview.isFetching,
    retry: () => void preview.refetch(),
    isLoaded: !!data,
    deletedRows: data ? getDeletedRows(data.deleted) : [],
    workspaceRows: data ? getWorkspaceChangeRows(data) : [],
    needsPassword,
    password,
    setPassword,
    passwordFooter: email ? t(k.deleteAccount.passwordFooter, { email }) : undefined,
    confirmFooter,
    canDelete,
    isDeleting,
    confirmDelete,
  };
}
