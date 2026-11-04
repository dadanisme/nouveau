import { Color, Stack } from 'expo-router';
import { ActivityIndicator, Platform } from 'react-native';

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
 * left item). iOS shows Save as a text "done" button; Android header actions are icon buttons, so
 * a check icon. View Proofs and Delete are rows in the form, not a header menu.
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
        canShowSave && (
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
        )
      )}
    </Stack.Toolbar>
  );
}
