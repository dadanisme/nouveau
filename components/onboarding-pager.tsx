import { Host, Image, ScrollView, TabView, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden,
  animation,
  Animation,
  background,
  font,
  foregroundStyle,
  frame,
  imageScale,
  indexViewStyle,
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
// Room under a page's text for the page dots, which SwiftUI draws over the page's bottom edge.
const DOTS_CLEARANCE = 56;

/**
 * The value pages (iOS): a SwiftUI `TabView` in the page style, its dots always shown on their
 * translucent capsule (the default dots are white, lost on the light grouped background), then a
 * large prominent Continue. A Continue tap changes `page`, and the `animation` modifier keyed on it
 * slides the TabView to the new page, as a swipe does.
 */
export function OnboardingPager({
  pages,
  page,
  onPageChange,
  continueLabel,
  onContinue,
}: OnboardingPagerProps) {
  return (
    <Host style={styles.fill} seedColor={ACCENT_COLOR}>
      <VStack spacing={16} modifiers={[padding({ bottom: 16 })]}>
        <TabView
          selection={String(page)}
          onSelectionChange={(selection) => onPageChange(Number(selection))}
          modifiers={[
            tabViewStyle({ type: 'page', indexDisplayMode: 'always' }),
            indexViewStyle({ backgroundDisplayMode: 'always' }),
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
        <VStack modifiers={[padding({ horizontal: SIDE })]}>
          <FormPrimaryButtonRow title={continueLabel} onPress={onContinue} />
        </VStack>
      </VStack>
    </Host>
  );
}

/**
 * A page's symbol, title and body, centered. At accessibility text sizes they can outgrow the page,
 * so they scroll from the top instead of truncating.
 */
function PageContent({ page }: { page: OnboardingPage }) {
  const isLargeText = useIsAccessibilityTextSize();
  const circleSize = useScaledSize(CIRCLE_SIZE);

  const content = (
    <VStack
      spacing={24}
      modifiers={[padding({ horizontal: SIDE, top: isLargeText ? 24 : 0, bottom: DOTS_CLEARANCE })]}
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

  return isLargeText ? <ScrollView>{content}</ScrollView> : content;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
