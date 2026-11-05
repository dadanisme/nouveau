import {
  FormListRow,
  FormLoadingRow,
  FormNavRow,
  FormNoticeRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import { ProfileHeaderRow } from '@/components/profile-header-row';
import { useLanguage } from '@/contexts/language';
import { useProfileScreen } from '@/hooks/use-profile-screen';
import { k } from '@/locales/keys';

const ICONS = {
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  deleteAccount: { sf: 'trash', md: require('@/assets/icons/delete.xml') },
} as const;

/**
 * Profile (pushed from Settings' profile row): avatar, name and email; the Name row opens the
 * name editor; the email and the linked sign-in methods are read-only; Delete Account sits last,
 * in its own section.
 */
export default function ProfileScreen() {
  const { t } = useLanguage();
  const screen = useProfileScreen();

  // The form is the screen's root view, so the native header's title collapses with its scroll.
  return (
    <NativeForm>
      <FormSection>
        <ProfileHeaderRow {...screen.header} />
        {screen.hasProfileError ? (
          <FormNoticeRow text={t(k.settings.profileError)} icon={ICONS.warning} />
        ) : null}
      </FormSection>

      <FormSection>
        <FormNavRow
          title={t(k.profile.name)}
          value={screen.displayName}
          onPress={screen.openName}
        />
        <FormListRow title={t(k.profile.email)} value={screen.email} />
      </FormSection>

      <FormSection title={t(k.profile.signInSection)}>
        {screen.isSignInMethodsLoading && !screen.signInMethods.length ? (
          <FormLoadingRow />
        ) : screen.hasSignInMethodsError && !screen.signInMethods.length ? (
          <FormNoticeRow text={t(k.profile.signInMethodsError)} icon={ICONS.warning} />
        ) : (
          screen.signInMethods.map((method) => (
            <FormListRow key={method.provider} title={method.label} />
          ))
        )}
      </FormSection>

      <FormSection>
        {/* Red like the destructive action it leads to; it pushes a screen that explains and
            confirms the deletion first (HIG managing-accounts#Deleting-accounts). */}
        <FormNavRow
          title={t(k.deleteAccount.title)}
          role="destructive"
          icon={ICONS.deleteAccount}
          onPress={screen.openDeleteAccount}
        />
      </FormSection>
    </NativeForm>
  );
}
