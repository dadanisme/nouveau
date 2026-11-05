import { Platform } from 'react-native';

import {
  FormButtonRow,
  FormListRow,
  FormLoadingRow,
  FormNoticeRow,
  FormSection,
  FormTextFieldRow,
  NativeForm,
} from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useDeleteAccountScreen } from '@/hooks/use-delete-account-screen';
import { k } from '@/locales/keys';
import type { DeletedItem } from '@/utils/account-deletion';

const DELETED_SYMBOLS = {
  profile: { sf: 'person.crop.circle', material: 'account_circle' },
  workspaces: { sf: 'person.2', material: 'group' },
  transactions: { sf: 'list.bullet.rectangle', material: 'receipt_long' },
  categories: { sf: 'square.grid.2x2', material: 'category' },
  receipts: { sf: 'doc.text.image', material: 'image' },
} as const satisfies Record<DeletedItem, FormSymbol>;

const WORKSPACE_SYMBOL = {
  sf: 'person.2.badge.gearshape',
  material: 'manage_accounts',
} as const satisfies FormSymbol;

const ICONS = {
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  delete: { sf: 'trash', md: require('@/assets/icons/delete.xml') },
} as const;

// iOS labels the password field with its section header; Android's field shows a floating label.
const HAS_PASSWORD_SECTION_TITLE = Platform.OS === 'ios';

/**
 * Delete Account (pushed from Settings): what is deleted for good, what passes to other members
 * of shared workspaces, the password for email accounts, and the red Delete Account button,
 * confirmed before anything happens (HIG managing-accounts#Deleting-accounts).
 */
export default function DeleteAccountScreen() {
  const { t } = useLanguage();
  const screen = useDeleteAccountScreen();

  // The form is the screen's root view, so the native header's title collapses with its scroll.
  return (
    <NativeForm>
      {screen.isLoading ? (
        <FormSection>
          <FormLoadingRow />
        </FormSection>
      ) : screen.hasError ? (
        <FormSection>
          <FormNoticeRow text={t(k.deleteAccount.loadFailed)} icon={ICONS.warning} />
          <FormButtonRow
            title={t(k.deleteAccount.tryAgain)}
            pending={screen.isRetrying}
            onPress={screen.retry}
          />
        </FormSection>
      ) : null}

      {screen.isLoaded ? (
        <>
          <FormSection title={t(k.deleteAccount.deletedSection)}>
            {screen.deletedRows.map((row) => (
              <FormListRow key={row.item} title={row.title} symbol={DELETED_SYMBOLS[row.item]} />
            ))}
          </FormSection>

          {screen.workspaceRows.length > 0 ? (
            <FormSection
              title={t(k.deleteAccount.sharedSection)}
              footer={t(k.deleteAccount.sharedFooter)}
            >
              {screen.workspaceRows.map((row) => (
                <FormListRow
                  key={row.id}
                  title={row.title}
                  subtitle={row.subtitle}
                  symbol={WORKSPACE_SYMBOL}
                />
              ))}
            </FormSection>
          ) : null}

          {screen.needsPassword ? (
            <FormSection
              title={HAS_PASSWORD_SECTION_TITLE ? t(k.deleteAccount.passwordSection) : undefined}
            >
              <FormTextFieldRow
                label={t(k.deleteAccount.passwordSection)}
                placeholder={t(k.deleteAccount.passwordPlaceholder)}
                value={screen.password}
                onChangeText={screen.setPassword}
                secure
                contentType="password"
                disabled={screen.isDeleting}
              />
            </FormSection>
          ) : null}

          <FormSection footer={screen.confirmFooter}>
            <FormButtonRow
              title={screen.isDeleting ? t(k.deleteAccount.deleting) : t(k.deleteAccount.title)}
              role="destructive"
              icon={ICONS.delete}
              disabled={!screen.canDelete}
              pending={screen.isDeleting}
              onPress={screen.confirmDelete}
            />
          </FormSection>
        </>
      ) : null}
    </NativeForm>
  );
}
