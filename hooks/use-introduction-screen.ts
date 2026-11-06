import { useLanguage } from '@/contexts/language';
import { useOnboardingPages } from '@/hooks/use-onboarding-pages';
import { goBackOrHome } from '@/lib/navigation';
import { k } from '@/locales/keys';

/**
 * Screen hook for View Introduction (Settings): the value pages again, as a modal (HIG onboarding:
 * let people replay it later). No Skip, Welcome or currency step: Continue moves on, and on the last
 * page it reads Done and closes the modal, as Close does.
 */
export function useIntroductionScreen() {
  const { t } = useLanguage();
  const pager = useOnboardingPages();

  return {
    pages: pager.pages,
    page: pager.page,
    setPage: pager.setPage,
    pageIndicatorLabel: pager.pageIndicatorLabel,
    continueLabel: pager.isLastPage ? t(k.common.done) : t(k.onboarding.continue),
    continue: () => {
      if (!pager.next()) goBackOrHome();
    },
    close: goBackOrHome,
  };
}
