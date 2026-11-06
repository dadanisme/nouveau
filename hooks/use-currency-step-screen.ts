import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useStartGuest } from '@/hooks/use-auth';
import { useMyWorkspaces, useUpdateWorkspace } from '@/hooks/use-workspaces';
import { showAlertDialog } from '@/lib/alert-dialog';
import { deviceCurrency } from '@/lib/guest';
import { resetTo } from '@/lib/navigation';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';
import { getCurrencyStepRows, suggestedHomeCurrency } from '@/utils/workspace';

/**
 * Screen hook for the onboarding currency step (#78): the device region's currency, preselected
 * under Suggested, then the other home currencies; one Continue accepts the selection. Only the
 * home currencies are offered (they all have exchange rates, which the guest upload needs, #100):
 * a region currency outside them suggests IDR, without the "from your region" footer.
 *
 * - Guest mode (Welcome's Get Started): starts the guest with the currency; the root Stack's guards
 *   (`useAuthRoutes`) then replace onboarding with the tabs.
 * - Account mode (`?for=account`, a brand-new account's first sign-in): writes the currency to
 *   the Personal workspace, even when unchanged, so the step is never asked again, then goes to
 *   the tabs. It has no way back: iOS hides Back and swipe-back (the layout), and Android's Back
 *   is held here, since the screens under it are the signed-out ones.
 */
export function useCurrencyStepScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ for?: string }>();
  const isAccountMode = params.for === 'account';

  const [suggestion] = useState(() => {
    const region = deviceCurrency();
    const code = suggestedHomeCurrency(region);
    return { rows: getCurrencyStepRows(code), isFromRegion: code === region };
  });
  const { rows } = suggestion;
  const [selection, setSelection] = useState(rows.suggested.code);

  const startGuest = useStartGuest();
  const updateWorkspace = useUpdateWorkspace();
  const workspaces = useMyWorkspaces();
  const personalWorkspace = workspaces.data?.find((workspace) => workspace.is_personal);
  const isSaving = startGuest.isPending || updateWorkspace.isPending;

  useFocusEffect(
    useCallback(() => {
      if (!isAccountMode || Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [isAccountMode]),
  );

  function showFailure(error: unknown) {
    showAlertDialog(
      t(k.onboarding.continueFailed),
      getErrorMessage(error, t(k.common.unexpectedError)),
    );
  }

  function submit() {
    if (isSaving) return;
    if (!isAccountMode) {
      startGuest.mutate(selection, { onError: showFailure });
      return;
    }
    if (!personalWorkspace) {
      showFailure(undefined);
      return;
    }
    updateWorkspace.mutate(
      { id: personalWorkspace.id, home_currency: selection },
      { onSuccess: () => resetTo('/'), onError: showFailure },
    );
  }

  return {
    isAccountMode,
    suggested: rows.suggested,
    isSuggestionFromRegion: suggestion.isFromRegion,
    others: rows.others,
    selection,
    select: setSelection,
    isSaving,
    // Account mode waits for the Personal workspace it writes to.
    canSubmit: !isAccountMode || !!personalWorkspace,
    submit,
  };
}
