import { Color, Stack } from 'expo-router';
import { ActivityIndicator, Platform } from 'react-native';

import { HEADER_ACTIONS_AS_SYMBOLS } from '@/components/sheet-toolbar';
import { useLanguage } from '@/contexts/language';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

interface TransactionFormToolbarProps {
  /** Saving: the Save action turns into an activity indicator. */
  isSaving: boolean;
  isSaveDisabled: boolean;
  onSave: () => void;
}

/**
 * Right side of the add/edit transaction header: Save as the confirmation action (Cancel is the
 * left item). iOS 26+ shows a prominent `checkmark` labelled "Save" (see
 * `HEADER_ACTIONS_AS_SYMBOLS`), iOS 17–18 a text "done" button; Android header actions are icon
 * buttons, so a check icon. View Proofs and Delete are rows in the form, not a header menu.
 */
export function TransactionFormToolbar({
  isSaving,
  isSaveDisabled,
  onSave,
}: TransactionFormToolbarProps) {
  const { t } = useLanguage();
  const checkIcon = useSymbolIcon({ sf: 'checkmark', md: 'check' });
  // Android needs icons as images, so its items wait for them rather than show an empty slot.
  const saveIcon = Platform.OS === 'android' ? checkIcon : undefined;
  const canShowSave = Platform.OS === 'ios' || !!saveIcon;
  // Android's header icon button keeps the toolbar tint when disabled, so a disabled Save would
  // look enabled: dim it to the M3 `outline` role. iOS dims disabled bar items itself.
  const disabledTint =
    Platform.OS === 'android' && isSaveDisabled ? Color.android.dynamic.outline : undefined;

  return (
    <Stack.Toolbar placement="right">
      {isSaving ? (
        <Stack.Toolbar.View>
          <ActivityIndicator accessibilityLabel={t(k.common.pleaseWait)} />
        </Stack.Toolbar.View>
      ) : (
        canShowSave &&
        (HEADER_ACTIONS_AS_SYMBOLS ? (
          <Stack.Toolbar.Button
            icon="checkmark"
            variant="prominent"
            disabled={isSaveDisabled}
            accessibilityLabel={t(k.common.save)}
            onPress={onSave}
          />
        ) : (
          <Stack.Toolbar.Button
            icon={saveIcon}
            variant="done"
            disabled={isSaveDisabled}
            tintColor={disabledTint}
            accessibilityLabel={t(k.common.save)}
            onPress={onSave}
          >
            {t(k.common.save)}
          </Stack.Toolbar.Button>
        ))
      )}
    </Stack.Toolbar>
  );
}
