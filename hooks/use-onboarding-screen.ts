import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { OnboardingPage } from '@/components/onboarding-types';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * Screen hook for the first-run value pages (#78): three pages (tracking, receipts and AI
 * categories, shared workspaces). Continue moves to the next page; on the last one, Continue and
 * Skip (on every page) both replace the pages with Welcome, so Back never returns to them.
 */
export function useOnboardingScreen() {
  const router = useRouter();
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

  function skip() {
    router.replace('/onboarding/welcome');
  }

  function continueOn() {
    if (page < pages.length - 1) setPage(page + 1);
    else skip();
  }

  return {
    pages,
    page,
    setPage,
    pageIndicatorLabel: t(k.onboarding.pageIndicator, { page: page + 1, count: pages.length }),
    skip,
    continue: continueOn,
  };
}
