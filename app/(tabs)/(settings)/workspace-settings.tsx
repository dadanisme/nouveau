import { FormSaveToolbar } from '@/components/form-save-toolbar';
import {
  FormButtonRow,
  FormListRow,
  FormPickerRow,
  FormSection,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceSettingsScreen } from '@/hooks/use-workspace-settings-screen';
import { k } from '@/locales/keys';

const ICONS = {
  member: { sf: 'person', md: require('@/assets/icons/person.xml') },
  invite: { sf: 'envelope', md: require('@/assets/icons/mail.xml') },
  addMember: { sf: 'person.badge.plus', md: require('@/assets/icons/person_add.xml') },
  remove: { sf: 'person.badge.minus', md: require('@/assets/icons/delete.xml') },
  revoke: { sf: 'xmark.circle', md: require('@/assets/icons/delete.xml') },
  delete: { sf: 'trash', md: require('@/assets/icons/delete.xml') },
  leave: { sf: 'rectangle.portrait.and.arrow.right', md: require('@/assets/icons/logout.xml') },
} as const;

/**
 * Workspace settings (`?id=`). The owner edits the name and home currency (saved from the
 * header), manages members (swipe / ⋮ to remove) and invites, and can delete a shared workspace;
 * members see the details read-only and can leave.
 */
export default function WorkspaceSettingsScreen() {
  const { t } = useLanguage();
  const screen = useWorkspaceSettingsScreen();

  return (
    <>
      {screen.isOwner ? (
        <FormSaveToolbar
          title={t(k.common.save)}
          disabled={!screen.canSave}
          onPress={screen.save}
        />
      ) : null}
      <NativeForm>
        {screen.isLoaded ? (
          <FormSection>
            {screen.isOwner ? (
              <>
                <FormTextFieldRow
                  label={t(k.workspace.workspaceName)}
                  placeholder={t(k.workspace.workspaceNamePlaceholder)}
                  value={screen.name}
                  onChangeText={screen.setName}
                  autoCapitalize="words"
                />
                <FormPickerRow
                  title={t(k.workspace.homeCurrency)}
                  options={screen.currencyOptions}
                  selection={screen.currency}
                  onSelectionChange={screen.setCurrency}
                />
              </>
            ) : (
              <>
                <FormListRow title={t(k.workspace.workspaceName)} value={screen.name} />
                <FormListRow title={t(k.workspace.homeCurrency)} value={screen.currency} />
              </>
            )}
          </FormSection>
        ) : null}

        <FormSection title={screen.membersTitle}>
          {screen.members.map((member) => (
            <FormListRow
              key={member.id}
              title={member.name}
              subtitle={member.role}
              icon={ICONS.member}
              actions={
                member.remove
                  ? [
                      {
                        title: t(k.workspace.remove),
                        role: 'destructive',
                        icon: ICONS.remove,
                        onPress: member.remove,
                      },
                    ]
                  : undefined
              }
            />
          ))}
        </FormSection>

        {screen.isOwner ? (
          <FormSection title={t(k.workspace.pendingInvites)}>
            {screen.invites.map((invite) => (
              <FormListRow
                key={invite.id}
                title={invite.email}
                subtitle={invite.expires}
                icon={ICONS.invite}
                actions={[
                  {
                    title: t(k.workspace.revoke),
                    role: 'destructive',
                    icon: ICONS.revoke,
                    onPress: invite.revoke,
                  },
                ]}
              />
            ))}
            <FormButtonRow
              title={t(k.workspace.inviteMember)}
              icon={ICONS.addMember}
              onPress={screen.openInviteSheet}
            />
          </FormSection>
        ) : null}

        {screen.isLoaded && !screen.isPersonal ? (
          <FormSection>
            {screen.isOwner ? (
              <FormButtonRow
                title={t(k.workspace.deleteWorkspace)}
                role="destructive"
                icon={ICONS.delete}
                disabled={screen.isRemoving}
                onPress={screen.confirmDelete}
              />
            ) : (
              <FormButtonRow
                title={t(k.workspace.leaveWorkspace)}
                role="destructive"
                icon={ICONS.leave}
                disabled={screen.isRemoving}
                onPress={screen.confirmLeave}
              />
            )}
          </FormSection>
        ) : null}
      </NativeForm>
    </>
  );
}
