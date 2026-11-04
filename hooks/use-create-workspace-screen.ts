import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useCreateWorkspace } from '@/hooks/use-workspaces';
import { showAlertDialog } from '@/lib/alert-dialog';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';
import { getHomeCurrencyOptions } from '@/utils/workspace';

const DEFAULT_CURRENCY = 'IDR';

/**
 * Screen hook for Create Workspace: name + home currency; creating switches to it and closes.
 * Going back with a typed name or a changed currency is confirmed first.
 */
export function useCreateWorkspaceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const createWorkspace = useCreateWorkspace();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const canSubmit = !createWorkspace.isPending && name.trim().length > 0;
  const leave = useDiscardGuard(name.trim().length > 0 || currency !== DEFAULT_CURRENCY, {
    pushed: true,
  });

  function submit() {
    const trimmed = name.trim();
    if (!trimmed || createWorkspace.isPending) return;
    createWorkspace.mutate(
      { name: trimmed, home_currency: currency },
      {
        onSuccess: async (newId) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (newId) await switchWorkspace(newId);
          leave(() => router.back());
        },
        onError: (error) => {
          showAlertDialog(
            t(k.workspace.failedToCreate),
            getErrorMessage(error, t(k.common.unexpectedError)),
          );
        },
      },
    );
  }

  return {
    name,
    setName,
    currency,
    setCurrency,
    currencyOptions: getHomeCurrencyOptions(),
    canSubmit,
    isPending: createWorkspace.isPending,
    submit,
  };
}
