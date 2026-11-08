import { PremiumPaywall } from '@/components/premium-paywall';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { useLanguage } from '@/contexts/language';
import { usePaywallSheet } from '@/hooks/use-paywall-sheet';
import { k } from '@/locales/keys';

/**
 * The Nouveau Premium paywall (#79): `?source=onboarding|feature|settings` (Not Now only from
 * onboarding), optional `?feature=` and the presenter's `requestId`. iOS has a leading Close in
 * its header; Android's form sheet is headerless, so the hero and buttons are all. Named
 * `paywall`, not `premium`, since Settings' `(settings)/premium` already takes `/premium`.
 */
export default function PaywallSheet() {
  const { t } = useLanguage();
  const sheet = usePaywallSheet();

  return (
    <>
      <SheetCloseToolbar onPress={sheet.close} />
      <PremiumPaywall
        title={sheet.title}
        tagline={sheet.tagline}
        benefits={sheet.benefits}
        state={sheet.state}
        notice={sheet.notice}
        retryLabel={t(k.premium.tryAgain)}
        onRetry={sheet.retry}
        plansTitle={sheet.plansTitle}
        planRows={sheet.planRows}
        onSelectPlan={sheet.selectPlan}
        trialFooter={sheet.trialFooter}
        primaryLabel={sheet.primaryLabel}
        isPurchasing={sheet.isPurchasing}
        canSubscribe={sheet.canSubscribe}
        onSubscribe={sheet.subscribe}
        disclosure={sheet.disclosure}
        restoreLabel={sheet.restoreLabel}
        isRestoring={sheet.isRestoring}
        canRestore={sheet.canRestore}
        onRestore={sheet.restorePurchases}
        termsLabel={sheet.termsLabel}
        privacyLabel={sheet.privacyLabel}
        onOpenTerms={sheet.openTerms}
        onOpenPrivacy={sheet.openPrivacy}
        notNowLabel={sheet.notNowLabel}
        onNotNow={sheet.close}
      />
    </>
  );
}
