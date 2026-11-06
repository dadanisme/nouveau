import { useState } from 'react';

import type { OnboardingPage } from '@/components/onboarding-types';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * The three value pages (#78: tracking, receipts and AI categories, shared workspaces) and the page
 * shown, shared by the first-run flow and the Settings replay (View Introduction).
 */
export function useOnboardingPages() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const pages: OnboardingPage[] = [
    {
      key: 'track',
      icon: { sf: 'chart.pie.fill', md: require('@/assets/icons/pie_chart.xml') },
      title: t(k.onboarding.trackTitle),
      body: t(k.onboarding.trackBody),
    },
    {
      key: 'scan',
      icon: { sf: 'doc.text.viewfinder', md: require('@/assets/icons/document_scanner.xml') },
      title: t(k.onboarding.scanTitle),
      body: t(k.onboarding.scanBody),
    },
    {
      key: 'share',
      icon: { sf: 'person.2.fill', md: require('@/assets/icons/group.xml') },
      title: t(k.onboarding.shareTitle),
      body: t(k.onboarding.shareBody),
    },
  ];

  const isLastPage = page === pages.length - 1;

  return {
    pages,
    page,
    setPage,
    isLastPage,
    /** Moves to the next page; false on the last page, so the caller leaves. */
    next: () => {
      if (isLastPage) return false;
      setPage(page + 1);
      return true;
    },
    pageIndicatorLabel: t(k.onboarding.pageIndicator, { page: page + 1, count: pages.length }),
  };
}
