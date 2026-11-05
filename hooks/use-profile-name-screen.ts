import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useLanguage } from '@/contexts/language';
import { useUpdateDisplayName } from '@/hooks/use-auth';
import { useDiscardGuard } from '@/hooks/use-discard-guard';
import { useProfileSummary } from '@/hooks/use-profile-summary';
import { showAlertDialog } from '@/lib/alert-dialog';
import { k } from '@/locales/keys';
import { getErrorMessage } from '@/utils/error';

/**
 * Screen hook for the name editor (pushed from Profile): one field prefilled with the current
 * name, saved from the header once it's non-empty and different. Saving goes back to Profile;
 * going back with an unsaved edit is confirmed first. Failures alert and keep the edit.
 */
export function useProfileNameScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { displayName } = useProfileSummary();
  const updateDisplayName = useUpdateDisplayName();

  // The edit over the saved name; null means untouched (shows the saved name).
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? displayName;
  const trimmed = name.trim();

  const isDirty = trimmed !== displayName.trim();
  const canSave = isDirty && trimmed.length > 0 && !updateDisplayName.isPending;
  const leave = useDiscardGuard(isDirty, { pushed: true });

  function save() {
    if (!canSave) return;
    updateDisplayName.mutate(trimmed, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        leave(() => router.back());
      },
      onError: (error) => {
        showAlertDialog(
          t(k.profile.saveFailed),
          getErrorMessage(error, t(k.common.unexpectedError)),
        );
      },
    });
  }

  return {
    name,
    setName: setDraft,
    canSave,
    isSaving: updateDisplayName.isPending,
    save,
  };
}
