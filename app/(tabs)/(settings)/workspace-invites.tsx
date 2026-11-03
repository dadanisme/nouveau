import {
  FormButtonRow,
  FormEmptyRow,
  FormListRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceInvitesScreen } from '@/hooks/use-workspace-invites-screen';
import { k } from '@/locales/keys';

const ICONS = {
  invite: { sf: 'person.2', md: require('@/assets/icons/group.xml') },
  accept: { sf: 'checkmark', md: require('@/assets/icons/check.xml') },
} as const;

const EMPTY_SYMBOL: FormSymbol = { sf: 'envelope', material: 'mail' };

/** Invites sent to me: one section per invite with an inline Accept action. */
export default function WorkspaceInvitesScreen() {
  const { t } = useLanguage();
  const screen = useWorkspaceInvitesScreen();

  return (
    <NativeForm>
      {screen.isEmpty ? (
        <FormSection>
          <FormEmptyRow title={t(k.workspace.noInvites)} symbol={EMPTY_SYMBOL} />
        </FormSection>
      ) : null}
      {screen.invites.map((invite) => (
        <FormSection key={invite.id}>
          <FormListRow title={invite.workspaceName} subtitle={invite.expires} icon={ICONS.invite} />
          <FormButtonRow
            title={invite.acceptTitle}
            icon={ICONS.accept}
            disabled={invite.acceptDisabled}
            onPress={invite.accept}
          />
        </FormSection>
      ))}
    </NativeForm>
  );
}
