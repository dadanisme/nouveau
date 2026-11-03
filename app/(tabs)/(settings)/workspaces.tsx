import { FormNavRow, FormSection, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useWorkspacesScreen } from '@/hooks/use-workspaces-screen';
import { k } from '@/locales/keys';

const ICONS = {
  settings: { sf: 'gearshape', md: require('@/assets/icons/settings.xml') },
  create: { sf: 'plus.circle', md: require('@/assets/icons/add_circle.xml') },
  invites: { sf: 'envelope', md: require('@/assets/icons/mail.xml') },
} as const;

// The form must be the screen's root view, so the native header scrolls with it.
export default function WorkspacesScreen() {
  const { t } = useLanguage();
  const screen = useWorkspacesScreen();

  return (
    <NativeForm>
      <FormSection title={t(k.workspace.current)}>
        <FormNavRow
          title={t(k.workspace.workspaceSettings)}
          icon={ICONS.settings}
          value={screen.workspaceName}
          onPress={screen.openWorkspaceSettings}
        />
      </FormSection>
      <FormSection>
        <FormNavRow
          title={t(k.workspace.create)}
          icon={ICONS.create}
          onPress={screen.openCreateWorkspace}
        />
        <FormNavRow
          title={t(k.workspace.pendingInvites)}
          icon={ICONS.invites}
          badge={screen.pendingInviteCount}
          onPress={screen.openInvites}
        />
      </FormSection>
    </NativeForm>
  );
}
