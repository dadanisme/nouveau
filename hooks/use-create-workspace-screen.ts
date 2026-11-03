import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useCreateWorkspace } from '@/hooks/use-workspaces';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';
import { getHomeCurrencyOptions } from '@/utils/workspace';

const DEFAULT_CURRENCY = 'IDR';

/** Screen hook for Create Workspace: name + home currency; creating switches to it and closes. */
export function useCreateWorkspaceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const createWorkspace = useCreateWorkspace();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const canSubmit = !createWorkspace.isPending && name.trim().length > 0;

  function submit() {
    const trimmed = name.trim();
    if (!trimmed || createWorkspace.isPending) return;
    createWorkspace.mutate(
      { name: trimmed, home_currency: currency },
      {
        onSuccess: async (newId) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (newId) await switchWorkspace(newId);
          router.back();
        },
        onError: (error) => {
          Alert.alert(
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
    submit,
  };
}
