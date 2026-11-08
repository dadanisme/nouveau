import { Box, Column, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  size,
} from '@expo/ui/jetpack-compose/modifiers';

import { ComposeSymbolIcon } from '@/components/compose-symbol-icon';
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
import type { PremiumPaywallProps } from '@/components/premium-paywall';
import { ACCENT_COLOR } from '@/constants/accent';

// Material 3 compact metrics: 24dp sheet top and side margins for the hero, the 48dp touch target
// for Not now, and room under the last row for the gesture bar (sheets don't inset for it).
const SIDE = 24;
const TOP = 24;
const BOTTOM_INSET = 48;
const CIRCLE_SIZE = 72;
const ICON_SIZE = 36;
const BUTTON_HEIGHT = 48;
const HERO_SYMBOL: FormSymbol = { sf: 'crown', material: 'workspace_premium' };
const ICONS = {
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
  restore: { sf: 'arrow.clockwise', md: require('@/assets/icons/autorenew.xml') },
} as const;

/**
 * The paywall (Android, #79), in a headerless form sheet: a hero (the symbol in a tinted circle,
 * the headline and a line), the benefits as list items, the plans as single-choice items (the
 * trial under them), the filled Subscribe / Start free trial with the renewal terms under it,
 * then Restore purchases and the Terms and Privacy links. The list scrolls when large text
 * outgrows the sheet.
 */
export function PremiumPaywall(props: PremiumPaywallProps) {
  return (
    <NativeForm bottomInset={BOTTOM_INSET}>
      <Hero title={props.title} tagline={props.tagline} />

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
            <FormNoticeRow text={props.notice} icon={ICONS.warning} />
            {props.state === 'error' ? (
              <FormButtonRow title={props.retryLabel} onPress={props.onRetry} />
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
          <TextButton
            onClick={props.onNotNow}
            enabled={!props.isPurchasing}
            modifiers={[fillMaxWidth(), padding(16, 8, 16, 0), height(BUTTON_HEIGHT)]}
          >
            <Text>{props.notNowLabel}</Text>
          </TextButton>
        ) : null}
      </FormSection>

      <FormSection>
        <FormButtonRow
          title={props.restoreLabel}
          icon={ICONS.restore}
          pending={props.isRestoring}
          disabled={!props.canRestore}
          onPress={props.onRestore}
        />
        <FormButtonRow title={props.termsLabel} onPress={props.onOpenTerms} />
        <FormButtonRow title={props.privacyLabel} onPress={props.onOpenPrivacy} />
      </FormSection>
    </NativeForm>
  );
}

function Hero({ title, tagline }: { title: string; tagline: string }) {
  const colors = useMaterialColors();
  return (
    <Column
      horizontalAlignment="center"
      verticalArrangement={{ spacedBy: 16 }}
      modifiers={[fillMaxWidth(), padding(SIDE, TOP, SIDE, 0)]}
    >
      <Box
        contentAlignment="center"
        modifiers={[
          size(CIRCLE_SIZE, CIRCLE_SIZE),
          clip(Shapes.Circle),
          background(colors.surfaceContainerHighest),
        ]}
      >
        {/* Decorative: the headline names it. */}
        <ComposeSymbolIcon
          symbol={{ ...HERO_SYMBOL, color: colors.primary }}
          iconSize={ICON_SIZE}
        />
      </Box>
      <Text color={colors.onSurface} style={{ typography: 'headlineSmall', textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        color={colors.onSurfaceVariant}
        style={{ typography: 'bodyMedium', textAlign: 'center' }}
      >
        {tagline}
      </Text>
    </Column>
  );
}
