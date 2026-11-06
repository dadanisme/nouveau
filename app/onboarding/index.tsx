import { OnboardingPager } from '@/components/onboarding-pager';
import { OnboardingSkipToolbar } from '@/components/onboarding-skip-toolbar';
import { useLanguage } from '@/contexts/language';
import { useOnboardingScreen } from '@/hooks/use-onboarding-screen';
import { k } from '@/locales/keys';

/** The first-run value pages (#78): swipe or Continue through three, or Skip to Welcome. */
export default function OnboardingScreen() {
  const { t } = useLanguage();
  const screen = useOnboardingScreen();

  return (
    <>
      <OnboardingSkipToolbar title={t(k.onboarding.skip)} onPress={screen.skip} />
      <OnboardingPager
        pages={screen.pages}
        page={screen.page}
        onPageChange={screen.setPage}
        continueLabel={t(k.onboarding.continue)}
        pageIndicatorLabel={screen.pageIndicatorLabel}
        onContinue={screen.continue}
      />
    </>
  );
}
