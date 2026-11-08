import { Button, HStack, Image, Section, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityHidden,
  background,
  buttonStyle,
  controlSize,
  disabled,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  imageScale,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  multilineTextAlignment,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import { FormDetailRow } from '@/components/form-detail-row';
import { FormPrimaryButtonRow } from '@/components/form-primary-button-row';
import {
  FormButtonRow,
  FormListRow,
  FormLoadingRow,
  FormNoticeRow,
  FormSection,
  NativeForm,
} from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { ACCENT_COLOR } from '@/constants/accent';
import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';
import type { PremiumPlan } from '@/utils/premium';

// The tinted circle behind the hero symbol at the default text size; it grows with it.
const CIRCLE_SIZE = 72;
const HERO_SYMBOL: FormSymbol = { sf: 'crown', material: 'workspace_premium' };
const WARNING = {
  sf: 'exclamationmark.triangle',
  md: require('@/assets/icons/warning.xml'),
} as const;

export type PremiumPaywallProps = {
  title: string;
  tagline: string;
  benefits: readonly { title: string; body: string; symbol: FormSymbol }[];
  /** What the plans section shows. */
  state: 'loading' | 'unavailable' | 'error' | 'ready';
  /** The unavailable / error line. */
  notice: string;
  retryLabel: string;
  /** Try Again works only while RevenueCat is identified as the signed-in account. */
  canRetry: boolean;
  onRetry: () => void;
  plansTitle: string;
  planRows: readonly {
    plan: PremiumPlan;
    title: string;
    subtitle: string;
    badge?: string;
    selected: boolean;
  }[];
  onSelectPlan: (plan: PremiumPlan) => void;
  /** "Try it free for 7 days, then Rp99,000/year.", when the store offers the trial. */
  trialFooter?: string;
  primaryLabel: string;
  isPurchasing: boolean;
  canSubscribe: boolean;
  onSubscribe: () => void;
  /** The renewal terms, under the purchase button. */
  disclosure?: string;
  restoreLabel: string;
  isRestoring: boolean;
  canRestore: boolean;
  onRestore: () => void;
  termsLabel: string;
  privacyLabel: string;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  /** Onboarding only: a borderless Not Now under the purchase button. */
  notNowLabel?: string;
  onNotNow: () => void;
};

/**
 * The paywall (iOS, #79), as a grouped SwiftUI form in the sheet: a hero (symbol in a tinted
 * circle, "Nouveau Premium", a line), the three benefits, the plans as single-choice rows (the
 * trial under them), the large prominent Subscribe / Start Free Trial with the renewal terms
 * under it, then Restore Purchases and the Terms and Privacy links. Rows stack at accessibility
 * text sizes like every form row.
 */
export function PremiumPaywall(props: PremiumPaywallProps) {
  const circleSize = useScaledSize(CIRCLE_SIZE);
  const isStacked = useIsAccessibilityTextSize();
  const wrap = fixedSize({ horizontal: false, vertical: true });

  return (
    <NativeForm>
      <Section>
        <VStack
          spacing={12}
          modifiers={[
            frame({ maxWidth: Infinity }),
            listRowBackground('clear'),
            listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
          ]}
        >
          {/* Decorative: the title names it. */}
          <Image
            systemName={HERO_SYMBOL.sf}
            color={ACCENT_COLOR}
            modifiers={[
              font({ textStyle: 'title' }),
              imageScale('large'),
              frame({ width: circleSize, height: circleSize }),
              background(PlatformColor('secondarySystemGroupedBackground'), shapes.circle()),
              accessibilityHidden(true),
            ]}
          />
          <Text
            modifiers={[
              font({ textStyle: 'title', weight: 'bold' }),
              multilineTextAlignment('center'),
              accessibilityAddTraits(['isHeader']),
              wrap,
            ]}
          >
            {props.title}
          </Text>
          <Text
            modifiers={[
              font({ textStyle: 'body' }),
              foregroundStyle(PlatformColor('secondaryLabel')),
              multilineTextAlignment('center'),
              wrap,
            ]}
          >
            {props.tagline}
          </Text>
        </VStack>
      </Section>

      <FormSection>
        {props.benefits.map((benefit) => (
          <FormDetailRow
            key={benefit.title}
            title={benefit.title}
            subtitle={benefit.body}
            symbol={{ ...benefit.symbol, color: ACCENT_COLOR }}
          />
        ))}
      </FormSection>

      <FormSection
        title={props.plansTitle}
        footer={props.state === 'ready' ? props.trialFooter : undefined}
      >
        {props.state === 'loading' ? (
          <FormLoadingRow />
        ) : props.state === 'ready' ? (
          props.planRows.map((row) => (
            <FormListRow
              key={row.plan}
              title={row.title}
              subtitle={row.subtitle}
              value={row.badge}
              selected={row.selected}
              onPress={() => props.onSelectPlan(row.plan)}
            />
          ))
        ) : (
          <>
            <FormNoticeRow text={props.notice} icon={WARNING} />
            {props.state === 'error' ? (
              <FormButtonRow
                title={props.retryLabel}
                onPress={props.onRetry}
                disabled={!props.canRetry}
              />
            ) : null}
          </>
        )}
      </FormSection>

      <FormSection footer={props.disclosure}>
        <FormPrimaryButtonRow
          title={props.primaryLabel}
          loading={props.isPurchasing}
          disabled={!props.canSubscribe}
          onPress={props.onSubscribe}
        />
        {props.notNowLabel ? (
          <Button
            onPress={props.onNotNow}
            modifiers={[
              buttonStyle('borderless'),
              controlSize('large'),
              disabled(props.isPurchasing),
              listRowBackground('clear'),
              listRowSeparator('hidden'),
            ]}
          >
            <Text modifiers={[frame({ maxWidth: Infinity, minHeight: 44 })]}>
              {props.notNowLabel}
            </Text>
          </Button>
        ) : null}
      </FormSection>

      <Section>
        {/* Restore and the legal links sit on the sheet background, under the purchase, as in
            StoreKit's own subscription sheet: plain links, not a card of misaligned rows. Each
            borderless button takes its own taps inside the one row. */}
        <VStack
          spacing={4}
          modifiers={[
            frame({ maxWidth: Infinity }),
            listRowBackground('clear'),
            listRowSeparator('hidden'),
          ]}
        >
          <FooterLink
            title={props.restoreLabel}
            disabled={!props.canRestore || props.isRestoring}
            onPress={props.onRestore}
          />
          {isStacked ? (
            <VStack spacing={4}>
              <FooterLink title={props.termsLabel} onPress={props.onOpenTerms} />
              <FooterLink title={props.privacyLabel} onPress={props.onOpenPrivacy} />
            </VStack>
          ) : (
            <HStack spacing={20}>
              <FooterLink title={props.termsLabel} onPress={props.onOpenTerms} />
              <FooterLink title={props.privacyLabel} onPress={props.onOpenPrivacy} />
            </HStack>
          )}
        </VStack>
      </Section>
    </NativeForm>
  );
}

/** A small borderless link under the purchase (Restore Purchases, Terms, Privacy), 44pt tall. */
function FooterLink({
  title,
  disabled: isDisabled,
  onPress,
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle('borderless'), disabled(Boolean(isDisabled))]}
    >
      <Text
        modifiers={[
          font({ textStyle: 'footnote' }),
          multilineTextAlignment('center'),
          frame({ minHeight: 44 }),
        ]}
      >
        {title}
      </Text>
    </Button>
  );
}
