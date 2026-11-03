import { Stack } from 'expo-router';
import { ActivityIndicator, Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

interface TransactionFormToolbarProps {
  isEditMode: boolean;
  /** Saving: the Save action turns into an activity indicator. */
  isSaving: boolean;
  isSaveDisabled: boolean;
  onSave: () => void;
  onViewProofs: () => void;
  onDelete: () => void;
}

/**
 * Right side of the add/edit transaction header: in edit mode the ⋯ menu (View Proofs, Delete),
 * then Save as the confirmation action (Cancel is the left item, set in the root layout). iOS
 * shows Save as a text "done" button; Android header actions are icon buttons, so a check icon.
 * A screen keeps one `Stack.Toolbar` per placement, so both items live here.
 */
export function TransactionFormToolbar({
  isEditMode,
  isSaving,
  isSaveDisabled,
  onSave,
  onViewProofs,
  onDelete,
}: TransactionFormToolbarProps) {
  const { t } = useLanguage();
  const moreIcon = useSymbolIcon({ sf: 'ellipsis.circle', md: 'more_vert' });
  const proofsIcon = useSymbolIcon({ sf: 'doc.text.magnifyingglass', md: 'find_in_page' });
  const deleteIcon = useSymbolIcon({ sf: 'trash', md: 'delete' });
  const checkIcon = useSymbolIcon({ sf: 'checkmark', md: 'check' });
  // Android needs icons as images, so its items wait for them rather than show an empty slot.
  const saveIcon = Platform.OS === 'android' ? checkIcon : undefined;
  const canShowSave = Platform.OS === 'ios' || !!saveIcon;

  return (
    <Stack.Toolbar placement="right">
      {isEditMode && moreIcon && (
        <Stack.Toolbar.Menu icon={moreIcon} accessibilityLabel={t(k.common.moreActions)}>
          <Stack.Toolbar.MenuAction icon={proofsIcon} onPress={onViewProofs}>
            {t(k.addTransaction.viewProofs)}
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon={deleteIcon} destructive onPress={onDelete}>
            {t(k.common.delete)}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      )}
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
