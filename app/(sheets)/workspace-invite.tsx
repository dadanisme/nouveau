import {
  FormButtonRow,
  FormListRow,
  FormSection,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceInviteSheet } from '@/hooks/use-workspace-invite-sheet';
import { k } from '@/locales/keys';

const ICONS = {
  send: { sf: 'paperplane', md: require('@/assets/icons/mail.xml') },
  copy: { sf: 'doc.on.doc', md: require('@/assets/icons/content_copy.xml') },
  done: { sf: 'checkmark', md: require('@/assets/icons/check.xml') },
} as const;

/**
 * Workspace invite sheet. Param: `workspaceId`. A native form with the email field and a send
 * action; once sent, the invite token with copy and done actions. A failed invite shows a native
 * alert.
 */
export default function WorkspaceInviteSheet() {
  const { t } = useLanguage();
  const invite = useWorkspaceInviteSheet();

  if (invite.createdToken) {
    return (
      <NativeForm title={t(k.workspace.inviteCreated)}>
        <FormSection footer={t(k.workspace.inviteShareHint)}>
          <FormListRow title={invite.createdToken} />
        </FormSection>
        <FormSection>
          <FormButtonRow
            title={invite.isCopied ? t(k.workspace.tokenCopied) : t(k.workspace.copyToken)}
            icon={ICONS.copy}
            onPress={invite.copyToken}
          />
          <FormButtonRow title={t(k.common.done)} icon={ICONS.done} onPress={invite.close} />
        </FormSection>
      </NativeForm>
    );
  }

  return (
    <NativeForm title={t(k.workspace.inviteByEmail)}>
      <FormSection>
        <FormTextFieldRow
          label={t(k.workspace.emailAddress)}
          placeholder={t(k.workspace.emailPlaceholder)}
          value={invite.email}
          onChangeText={invite.setEmail}
          keyboard="email"
          autoFocus
          submitLabel="send"
          onSubmit={invite.submit}
        />
      </FormSection>
      <FormSection>
        <FormButtonRow
          title={invite.isPending ? t(k.common.pleaseWait) : t(k.workspace.sendInvite)}
          icon={ICONS.send}
          disabled={!invite.canSubmit}
          onPress={invite.submit}
        />
      </FormSection>
    </NativeForm>
  );
}
