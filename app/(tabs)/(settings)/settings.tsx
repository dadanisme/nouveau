import {
  FormButtonRow,
  FormNavRow,
  FormNoticeRow,
  FormPickerRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import { ProfileHeaderRow } from '@/components/profile-header-row';
import { useLanguage } from '@/contexts/language';
import { useSettingsScreen } from '@/hooks/use-settings-screen';
import { k } from '@/locales/keys';

const ICONS = {
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  currentWorkspace: { sf: 'arrow.left.arrow.right', md: require('@/assets/icons/swap_horiz.xml') },
  workspaces: { sf: 'person.2', md: require('@/assets/icons/group.xml') },
  categories: { sf: 'square.grid.2x2', md: require('@/assets/icons/category.xml') },
  subscriptions: {
    sf: 'arrow.triangle.2.circlepath',
    md: require('@/assets/icons/autorenew.xml'),
  },
  language: { sf: 'globe', md: require('@/assets/icons/language.xml') },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', md: require('@/assets/icons/logout.xml') },
} as const;

// The form must be the screen's root view: the native header's large title collapses with it.
export default function SettingsScreen() {
  const { t } = useLanguage();
  const screen = useSettingsScreen();

  return (
    <NativeForm>
      <FormSection>
        <ProfileHeaderRow
          {...screen.profile}
          accessibilityHint={t(k.profile.openHint)}
          onPress={screen.openProfile}
        />
        {screen.hasProfileError ? (
          <FormNoticeRow text={t(k.settings.profileError)} icon={ICONS.warning} />
        ) : null}
      </FormSection>

      <FormSection title={t(k.settings.workspaceSection)}>
        <FormNavRow
          title={t(k.workspace.current)}
          icon={ICONS.currentWorkspace}
          value={screen.workspaceName}
          onPress={screen.openWorkspaceSwitcher}
        />
        <FormNavRow
          title={t(k.workspace.workspaces)}
          icon={ICONS.workspaces}
          badge={screen.pendingInviteCount}
          onPress={screen.openWorkspaces}
        />
      </FormSection>

      <FormSection title={t(k.settings.manageSection)}>
        <FormNavRow
          title={t(k.settings.categories)}
          icon={ICONS.categories}
          onPress={screen.openCategories}
        />
        <FormNavRow
          title={t(k.settings.subscriptions)}
          icon={ICONS.subscriptions}
          onPress={screen.openSubscriptions}
        />
      </FormSection>

      <FormSection title={t(k.settings.preferencesSection)}>
        <FormPickerRow
          title={t(k.settings.language)}
          icon={ICONS.language}
          options={screen.languageOptions}
          selection={screen.locale}
          onSelectionChange={screen.setLocale}
        />
      </FormSection>

      <FormSection>
        <FormButtonRow
          title={screen.signOutPending ? t(k.settings.signingOut) : t(k.settings.signOut)}
          icon={ICONS.signOut}
          pending={screen.signOutPending}
          onPress={screen.confirmSignOut}
        />
      </FormSection>
    </NativeForm>
  );
}
