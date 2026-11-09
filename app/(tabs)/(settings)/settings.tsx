import {
  FormButtonRow,
  FormLinkRow,
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
  signIn: { sf: 'person.crop.circle', md: require('@/assets/icons/account_circle.xml') },
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  currentWorkspace: { sf: 'arrow.left.arrow.right', md: require('@/assets/icons/swap_horiz.xml') },
  workspaces: { sf: 'person.2', md: require('@/assets/icons/group.xml') },
  categories: { sf: 'square.grid.2x2', md: require('@/assets/icons/category.xml') },
  premium: { sf: 'crown', md: require('@/assets/icons/workspace_premium.xml') },
  language: { sf: 'globe', md: require('@/assets/icons/language.xml') },
  introduction: { sf: 'sparkles', md: require('@/assets/icons/auto_awesome.xml') },
  terms: { sf: 'doc.text', md: require('@/assets/icons/description.xml') },
  privacy: { sf: 'hand.raised', md: require('@/assets/icons/privacy_tip.xml') },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', md: require('@/assets/icons/logout.xml') },
  eraseData: { sf: 'trash', md: require('@/assets/icons/delete.xml') },
} as const;

// The form must be the screen's root view: the native header's large title collapses with it.
export default function SettingsScreen() {
  const { t } = useLanguage();
  const screen = useSettingsScreen();

  return (
    <NativeForm>
      {/* A guest's way to an account (#100); signing in uploads their device data. */}
      {screen.isGuest ? (
        <FormSection>
          <FormNavRow
            title={t(k.settings.signIn)}
            icon={ICONS.signIn}
            onPress={screen.openSignIn}
          />
        </FormSection>
      ) : null}

      {/* A guest has no profile (#100): the Sign In row above stands in for it. */}
      {screen.isGuest ? null : (
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
      )}

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
        {/* Nouveau Premium (#79): status, upgrade, manage. A guest sees it too; the tap asks
            them to sign in first (buying needs an account). */}
        <FormNavRow
          title={t(k.settings.premium)}
          icon={ICONS.premium}
          value={screen.premiumValue}
          onPress={screen.openPremium}
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
        {/* The first-run value pages again, in a modal (HIG onboarding: replayable later). */}
        <FormNavRow
          title={t(k.settings.viewIntroduction)}
          icon={ICONS.introduction}
          onPress={screen.openIntroduction}
        />
      </FormSection>

      {/* The legal pages (#81), for guests too: web pages in the in-app browser, so link rows. */}
      <FormSection title={t(k.settings.aboutSection)}>
        <FormLinkRow title={t(k.legal.terms)} icon={ICONS.terms} onPress={screen.openTerms} />
        <FormLinkRow title={t(k.legal.privacy)} icon={ICONS.privacy} onPress={screen.openPrivacy} />
      </FormSection>

      <FormSection>
        {/* A guest has no account to sign out of: Erase Data deletes the device's data (#100). */}
        {screen.isGuest ? (
          <FormButtonRow
            title={screen.erasePending ? t(k.settings.erasingData) : t(k.settings.eraseData)}
            role="destructive"
            icon={ICONS.eraseData}
            pending={screen.erasePending}
            onPress={screen.confirmEraseData}
          />
        ) : (
          <FormButtonRow
            title={screen.signOutPending ? t(k.settings.signingOut) : t(k.settings.signOut)}
            icon={ICONS.signOut}
            pending={screen.signOutPending}
            onPress={screen.confirmSignOut}
          />
        )}
      </FormSection>
    </NativeForm>
  );
}
