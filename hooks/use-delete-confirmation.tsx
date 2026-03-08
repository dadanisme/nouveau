import { useState } from 'react';

import { Alert } from '@/components/alert';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

export function useDeleteConfirmation() {
  const deleteMutation = useDeleteTransaction();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function confirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  return {
    requestDelete: setDeleteTarget,
    deleteConfirmAlert: (
      <Alert
        visible={!!deleteTarget}
        title={i18n.t(k.addTransaction.deleteTransaction)}
        message={i18n.t(k.addTransaction.deleteTransactionMessage)}
        actions={[
          { label: i18n.t(k.common.cancel), onPress: () => setDeleteTarget(null) },
          { label: i18n.t(k.common.delete), variant: 'dark' as const, onPress: confirm },
        ]}
        onDismiss={() => setDeleteTarget(null)}
      />
    ),
  };
}
