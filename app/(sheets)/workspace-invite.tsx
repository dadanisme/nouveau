import { Stack } from 'expo-router';

import { FormSaveToolbar } from '@/components/form-save-toolbar';
import {
  FormButtonRow,
  FormListRow,
  FormSection,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { SheetCancelToolbar, SheetCloseToolbar } from '@/components/sheet-toolbar';
import { SHEET_HAS_HEADER } from '@/constants/sheet-options';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceInviteSheet } from '@/hooks/use-workspace-invite-sheet';
import { k } from '@/locales/keys';

const ICONS = {
  send: { sf: 'paperplane', md: require('@/assets/icons/mail.xml') },
  copy: { sf: 'doc.on.doc', md: require('@/assets/icons/content_copy.xml') },
  done: { sf: 'checkmark', md: require('@/assets/icons/check.xml') },
} as const;

/**
 * Workspace invite sheet. Param: `workspaceId`. A native form with the email field; once sent,
 * the invite token with a copy action. iOS sends from the header (Cancel / Send) and closes the
 * token step with a leading Close; Android's headerless sheet keeps Send and Done rows. A failed
 * invite shows a native alert.
 */
export default function WorkspaceInviteSheet() {
  const { t } = useLanguage();
  const invite = useWorkspaceInviteSheet();

  if (invite.createdToken) {
    return (
      <>
        <Stack.Screen options={{ title: t(k.workspace.inviteCreated) }} />
        {SHEET_HAS_HEADER ? <SheetCloseToolbar onPress={invite.close} /> : null}
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
            {SHEET_HAS_HEADER ? null : (
              <FormButtonRow title={t(k.common.done)} icon={ICONS.done} onPress={invite.close} />
            )}
          </FormSection>
        </NativeForm>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t(k.workspace.inviteByEmail) }} />
      {SHEET_HAS_HEADER ? (
        <>
          <SheetCancelToolbar onPress={invite.close} />
          <FormSaveToolbar
            title={t(k.common.send)}
            disabled={!invite.canSubmit}
            pending={invite.isPending}
            onPress={invite.submit}
          />
        </>
      ) : null}
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
        {SHEET_HAS_HEADER ? null : (
          <FormSection>
            <FormButtonRow
              title={invite.isPending ? t(k.common.pleaseWait) : t(k.workspace.sendInvite)}
              icon={ICONS.send}
              pending={invite.isPending}
              disabled={!invite.canSubmit}
              onPress={invite.submit}
            />
          </FormSection>
        )}
      </NativeForm>
    </>
  );
}
