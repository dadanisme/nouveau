import { Platform } from 'react-native';

import { FormSaveToolbar } from '@/components/form-save-toolbar';
import { FormPickerRow, FormSection, FormTextFieldRow, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCreateWorkspaceScreen } from '@/hooks/use-create-workspace-screen';
import { k } from '@/locales/keys';

// iOS labels the name field with its section header; Android's field shows a floating label.
const HAS_NAME_SECTION_TITLE = Platform.OS === 'ios';

/**
 * New workspace: name and home currency, created only from the header's trailing action. The
 * keyboard's Done just dismisses it.
 */
export default function CreateWorkspaceScreen() {
  const { t } = useLanguage();
  const screen = useCreateWorkspaceScreen();

  return (
    <>
      <FormSaveToolbar
        title={t(k.workspace.createAction)}
        disabled={!screen.canSubmit}
        pending={screen.isPending}
        onPress={screen.submit}
      />
      <NativeForm>
        <FormSection title={HAS_NAME_SECTION_TITLE ? t(k.workspace.workspaceName) : undefined}>
          <FormTextFieldRow
            label={t(k.workspace.workspaceName)}
            placeholder={t(k.workspace.workspaceNamePlaceholder)}
            value={screen.name}
            onChangeText={screen.setName}
            autoCapitalize="words"
            autoFocus
            submitLabel="done"
          />
        </FormSection>
        <FormSection>
          <FormPickerRow
            title={t(k.workspace.homeCurrency)}
            options={screen.currencyOptions}
            selection={screen.currency}
            onSelectionChange={screen.setCurrency}
          />
        </FormSection>
      </NativeForm>
    </>
  );
}
