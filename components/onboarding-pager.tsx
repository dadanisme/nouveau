import { Circle, HStack, Host, Image, ScrollView, TabView, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  animation,
  Animation,
  background,
  font,
  foregroundStyle,
  frame,
  imageScale,
  multilineTextAlignment,
  padding,
  shapes,
  tabViewStyle,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import type { OnboardingPage, OnboardingPagerProps } from '@/components/onboarding-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';

// The tinted circle behind each page's symbol, at the default text size; it grows with it.
const CIRCLE_SIZE = 112;
// HIG layout: the system's 20pt side margins on iPhone; the body gets a little more, to keep lines
// a readable length.
const SIDE = 20;
const BODY_SIDE = 32;
// The system page control's dots (UIPageControl): 7pt, 9pt apart, on a 26pt-tall control.
const DOT_SIZE = 7;
const DOT_SPACING = 9;
const DOTS_HEIGHT = 26;

/**
 * The value pages (iOS): a SwiftUI `TabView` in the page style, our own page dots under it, then a
 * large prominent Continue. The TabView's own dots are white, lost on the light grouped
 * background, and its capsule backdrop reads as a control, so they're hidden. A Continue tap
 * changes `page`, and the `animation` modifier keyed on it slides the TabView to the new page, as
 * a swipe does.
 */
export function OnboardingPager({
  pages,
  page,
  onPageChange,
  continueLabel,
  pageIndicatorLabel,
  onContinue,
}: OnboardingPagerProps) {
  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      <VStack spacing={16} modifiers={[padding({ bottom: 16 })]}>
        <TabView
          selection={String(page)}
          onSelectionChange={(selection) => onPageChange(Number(selection))}
          modifiers={[
            tabViewStyle({ type: 'page', indexDisplayMode: 'never' }),
            frame({ maxWidth: Infinity, maxHeight: Infinity }),
            animation(Animation.default, page),
          ]}
        >
          {pages.map((item, index) => (
            <TabView.Tab key={item.key} value={String(index)}>
              <PageContent page={item} />
            </TabView.Tab>
          ))}
        </TabView>
        <PageDots count={pages.length} page={page} label={pageIndicatorLabel} />
        <VStack modifiers={[padding({ horizontal: SIDE })]}>
          <FormPrimaryButtonRow title={continueLabel} onPress={onContinue} />
        </VStack>
      </VStack>
    </Host>
  );
}

/**
 * The page dots, as the system page control draws them: the current page in `label`, the others in
 * `tertiaryLabel`, readable on the grouped background in both appearances. VoiceOver reads the
 * row as one element, "Page 1 of 3". @expo/ui has no adjustable action, so it's a label only; a
 * swipe or Continue turns the page.
 */
function PageDots({ count, page, label }: { count: number; page: number; label: string }) {
  return (
    <HStack
      spacing={DOT_SPACING}
      modifiers={[
        frame({ height: DOTS_HEIGHT }),
        animation(Animation.default, page),
        accessibilityElement('ignore'),
        accessibilityLabel(label),
      ]}
    >
      {Array.from({ length: count }, (_, index) => (
        <Circle
          key={index}
          modifiers={[
            foregroundStyle(PlatformColor(index === page ? 'label' : 'tertiaryLabel')),
            frame({ width: DOT_SIZE, height: DOT_SIZE }),
          ]}
        />
      ))}
    </HStack>
  );
}

/**
 * A page's symbol, title and body, centered. At accessibility text sizes they can outgrow the page,
 * so they scroll from the top instead of truncating.
 *
 * The tab's own child stays the same `VStack` whatever the text size: on iOS 18+ the TabView reads
 * a tab's children once and doesn't observe them, so swapping that child (VStack for ScrollView)
 * on a live Dynamic Type change left the page blank. The swap happens inside this VStack, which
 * does observe its children.
 */
function PageContent({ page }: { page: OnboardingPage }) {
  const isLargeText = useIsAccessibilityTextSize();
  const circleSize = useScaledSize(CIRCLE_SIZE);

  const content = (
    <VStack
      spacing={24}
      modifiers={[padding({ horizontal: SIDE, top: isLargeText ? 24 : 0, bottom: 16 })]}
    >
      {/* Decorative: the title says what the page is about. */}
      <Image
        systemName={page.icon.sf}
        color={ACCENT_COLOR}
        modifiers={[
          font({ textStyle: 'largeTitle' }),
          imageScale('large'),
          frame({ width: circleSize, height: circleSize }),
          background(PlatformColor('secondarySystemGroupedBackground'), shapes.circle()),
          accessibilityHidden(true),
        ]}
      />
      <VStack spacing={12} modifiers={[padding({ horizontal: BODY_SIDE - SIDE })]}>
        <Text
          modifiers={[
            font({ textStyle: 'title', weight: 'bold' }),
            multilineTextAlignment('center'),
          ]}
        >
          {page.title}
        </Text>
        <Text
          modifiers={[
            font({ textStyle: 'body' }),
            foregroundStyle(PlatformColor('secondaryLabel')),
            multilineTextAlignment('center'),
          ]}
        >
          {page.body}
        </Text>
      </VStack>
    </VStack>
  );

  return (
    <VStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
      {isLargeText ? <ScrollView>{content}</ScrollView> : content}
    </VStack>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
