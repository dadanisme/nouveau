import { Platform } from 'react-native';

import { OnboardingPager } from '@/components/onboarding-pager';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { useIntroductionScreen } from '@/hooks/use-introduction-screen';

/**
 * View Introduction (Settings): the first-run value pages replayed in a modal, for guests and
 * accounts alike. iOS has the leading `xmark` Close; Android keeps its Up arrow.
 */
export default function IntroductionScreen() {
  const screen = useIntroductionScreen();

  return (
    <>
      {Platform.OS === 'ios' ? <SheetCloseToolbar onPress={screen.close} /> : null}
      <OnboardingPager
        pages={screen.pages}
        page={screen.page}
        onPageChange={screen.setPage}
        continueLabel={screen.continueLabel}
        pageIndicatorLabel={screen.pageIndicatorLabel}
        onContinue={screen.continue}
      />
    </>
  );
}
