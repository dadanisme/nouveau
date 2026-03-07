import { useState } from 'react';

import { Alert } from '@/components/alert';
import { useDeleteTransaction } from '@/hooks/use-delete-transaction';

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
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        actions={[
          { label: 'Cancel', onPress: () => setDeleteTarget(null) },
          { label: 'Delete', variant: 'dark' as const, onPress: confirm },
        ]}
        onDismiss={() => setDeleteTarget(null)}
      />
    ),
  };
}
