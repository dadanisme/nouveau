import { Platform } from 'react-native';

import { FormSaveToolbar } from '@/components/form-save-toolbar';
import { FormSection, FormTextFieldRow, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useProfileNameScreen } from '@/hooks/use-profile-name-screen';
import { k } from '@/locales/keys';

// iOS labels the field with its section header; Android's field shows a floating label.
const HAS_NAME_SECTION_TITLE = Platform.OS === 'ios';

/**
 * The name editor (pushed from Profile): one field, saved only from the header's trailing action
 * (dimmed on iOS, hidden on Android until the name is non-empty and changed). The keyboard's Done
 * just dismisses it.
 */
export default function ProfileNameScreen() {
  const { t } = useLanguage();
  const screen = useProfileNameScreen();

  return (
    <>
      <FormSaveToolbar
        title={t(k.common.save)}
        disabled={!screen.canSave}
        pending={screen.isSaving}
        onPress={screen.save}
      />
      <NativeForm>
        <FormSection title={HAS_NAME_SECTION_TITLE ? t(k.profile.name) : undefined}>
          <FormTextFieldRow
            label={t(k.profile.name)}
            placeholder={t(k.profile.name)}
            value={screen.name}
            onChangeText={screen.setName}
            autoCapitalize="words"
            autoFocus
            submitLabel="done"
            disabled={screen.isSaving}
          />
        </FormSection>
      </NativeForm>
    </>
  );
}
