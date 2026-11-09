import {
  FormButtonRow,
  FormLinkRow,
  FormListRow,
  FormLoadingRow,
  FormNoticeRow,
  FormSection,
  FormToggleRow,
  NativeForm,
} from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { usePremiumScreen } from '@/hooks/use-premium-screen';
import { k } from '@/locales/keys';

const STATUS_SYMBOL: FormSymbol = {
  sf: 'crown',
  material: 'workspace_premium',
  color: ACCENT_COLOR,
};
const ICONS = {
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  upgrade: { sf: 'crown', md: require('@/assets/icons/workspace_premium.xml') },
  restore: { sf: 'arrow.clockwise', md: require('@/assets/icons/autorenew.xml') },
  ai: { sf: 'sparkles', md: require('@/assets/icons/auto_awesome.xml') },
  privacy: { sf: 'hand.raised', md: require('@/assets/icons/privacy_tip.xml') },
} as const;

/**
 * Settings' Premium (#79): the status row, Upgrade to Premium while free (the paywall), Manage
 * Subscription for a store subscription, and Restore Purchases. Replaces the admin-grant
 * Subscriptions screen; grants show as "Premium (Granted)". Signed in, the AI Processing toggle
 * (#122) says what it sends and to whom, with the Privacy Policy.
 */
// The form must be the screen's root view: the native header collapses with its scroll.
export default function PremiumScreen() {
  const { t } = useLanguage();
  const screen = usePremiumScreen();

  return (
    <NativeForm onRefresh={screen.refresh}>
      <FormSection>
        {screen.isLoading ? (
          <FormLoadingRow />
        ) : (
          <FormListRow
            title={screen.statusTitle}
            subtitle={screen.statusDetail}
            symbol={STATUS_SYMBOL}
          />
        )}
        {screen.hasError ? (
          <>
            <FormNoticeRow text={t(k.premium.statusLoadFailed)} icon={ICONS.warning} />
            <FormButtonRow title={t(k.premium.tryAgain)} onPress={screen.retry} />
          </>
        ) : null}
      </FormSection>

      {screen.canUpgrade && !screen.isLoading ? (
        <FormSection>
          <FormButtonRow
            title={t(k.premium.upgrade)}
            icon={ICONS.upgrade}
            emphasis="filled"
            onPress={screen.upgrade}
          />
        </FormSection>
      ) : null}

      {screen.canManage ? (
        <FormSection footer={screen.manageFooter}>
          <FormButtonRow title={t(k.premium.manage)} onPress={screen.manage} />
        </FormSection>
      ) : null}

      {screen.showsAiProcessing ? (
        <FormSection footer={t(k.aiConsent.footer)}>
          <FormToggleRow
            title={t(k.aiConsent.toggle)}
            icon={ICONS.ai}
            value={screen.isAiProcessingOn}
            disabled={screen.isAiProcessingDisabled}
            onValueChange={screen.setAiProcessing}
          />
          <FormLinkRow
            title={t(k.legal.privacy)}
            icon={ICONS.privacy}
            onPress={screen.openPrivacy}
          />
        </FormSection>
      ) : null}

      <FormSection footer={screen.isAvailable ? undefined : t(k.premium.unavailable)}>
        <FormButtonRow
          title={screen.restoreLabel}
          icon={ICONS.restore}
          pending={screen.isRestoring}
          disabled={!screen.isAvailable}
          onPress={screen.restorePurchases}
        />
      </FormSection>
    </NativeForm>
  );
}
