import { useRouter } from 'expo-router';

import { useOnboardingPages } from '@/hooks/use-onboarding-pages';

/**
 * Screen hook for the first-run value pages (#78). Continue moves to the next page; on the last
 * one, Continue and Skip (on every page) both replace the pages with Welcome, so Back never
 * returns to them.
 */
export function useOnboardingScreen() {
  const router = useRouter();
  const pager = useOnboardingPages();

  function skip() {
    router.replace('/onboarding/welcome');
  }

  return {
    pages: pager.pages,
    page: pager.page,
    setPage: pager.setPage,
    pageIndicatorLabel: pager.pageIndicatorLabel,
    skip,
    continue: () => {
      if (!pager.next()) skip();
    },
  };
}
