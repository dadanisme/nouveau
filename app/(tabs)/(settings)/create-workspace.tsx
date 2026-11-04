import { FormSaveToolbar } from '@/components/form-save-toolbar';
import { FormPickerRow, FormSection, FormTextFieldRow, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCreateWorkspaceScreen } from '@/hooks/use-create-workspace-screen';
import { k } from '@/locales/keys';

/** New workspace: name and home currency, created from the header's trailing action. */
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
        <FormSection>
          <FormTextFieldRow
            label={t(k.workspace.workspaceName)}
            placeholder={t(k.workspace.workspaceNamePlaceholder)}
            value={screen.name}
            onChangeText={screen.setName}
            autoCapitalize="words"
            autoFocus
            submitLabel="done"
            onSubmit={screen.submit}
          />
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
