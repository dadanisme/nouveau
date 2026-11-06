import {
  Box,
  Column,
  HorizontalPager,
  Icon,
  Row,
  Text,
  useMaterialColors,
  type HorizontalPagerHandle,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxSize,
  fillMaxWidth,
  padding,
  semantics,
  Shapes,
  size,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposeHost } from '@/components/compose-host';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { OnboardingPage, OnboardingPagerProps } from '@/components/onboarding-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 compact metrics: 24dp page margins, 16dp under the button.
const SIDE = 24;
const BOTTOM = 16;
const CIRCLE_SIZE = 112;
const ICON_SIZE = 48;
const DOT_SIZE = 8;

// The system (dynamic) palette; the accent only tints, as the `primary` role (the filled button,
// the symbol, the current page's dot). `onPrimary` is its pairing: white on the accent in both
// themes, as on Login.
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * The value pages (Android): a Compose `HorizontalPager`, a row of page dots, then a full-width M3
 * filled Continue. A Continue tap changes `page`, which scrolls the pager there with
 * `animateScrollToPage`; a swipe reports the page it settles on.
 */
export function OnboardingPager(props: OnboardingPagerProps) {
  return (
    <ComposeHost style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <PagerSurface {...props} />
    </ComposeHost>
  );
}

function PagerSurface({
  pages,
  page,
  onPageChange,
  continueLabel,
  pageIndicatorLabel,
  onContinue,
}: OnboardingPagerProps) {
  const colors = useMaterialColors();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<HorizontalPagerHandle>(null);
  // The page the pager last settled on, so a settle reported back as `page` doesn't scroll again.
  const settledPage = useRef(page);

  useEffect(() => {
    if (page !== settledPage.current) pagerRef.current?.animateScrollToPage(page);
  }, [page]);

  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: BOTTOM }}
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        padding(0, 0, 0, insets.bottom + BOTTOM),
      ]}
    >
      <HorizontalPager
        ref={pagerRef}
        initialPage={page}
        onSettledPageChange={(settled) => {
          settledPage.current = settled;
          onPageChange(settled);
        }}
        modifiers={[fillMaxWidth(), weight(1)]}
      >
        {pages.map((item) => (
          <PageContent key={item.key} page={item} colors={colors} />
        ))}
      </HorizontalPager>
      <Row
        horizontalArrangement={{ spacedBy: DOT_SIZE }}
        verticalAlignment="center"
        modifiers={[semantics({ contentDescription: pageIndicatorLabel })]}
      >
        {pages.map((item, index) => (
          <Box
            key={item.key}
            modifiers={[
              size(DOT_SIZE, DOT_SIZE),
              clip(Shapes.Circle),
              background(index === page ? colors.primary : colors.outlineVariant),
            ]}
          />
        ))}
      </Row>
      <FormPrimaryButtonRow title={continueLabel} onPress={onContinue} />
    </Column>
  );
}

/** A page's symbol in a tinted circle, title and body, centered on the page. */
function PageContent({ page, colors }: { page: OnboardingPage; colors: MaterialColors }) {
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement="center"
      modifiers={[fillMaxSize(), padding(SIDE, SIDE, SIDE, SIDE)]}
    >
      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 24 }}>
        <Box
          contentAlignment="center"
          modifiers={[
            size(CIRCLE_SIZE, CIRCLE_SIZE),
            clip(Shapes.Circle),
            background(colors.surfaceContainerHighest),
          ]}
        >
          {/* Decorative: the title says what the page is about. */}
          <Icon source={page.icon.md} tint={colors.primary} size={ICON_SIZE} />
        </Box>
        <Text color={colors.onSurface} style={{ typography: 'headlineSmall', textAlign: 'center' }}>
          {page.title}
        </Text>
        <Text
          color={colors.onSurfaceVariant}
          style={{ typography: 'bodyLarge', textAlign: 'center' }}
        >
          {page.body}
        </Text>
      </Column>
    </Column>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
