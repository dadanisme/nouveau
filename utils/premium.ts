import type { FormSymbol } from '@/components/native-form-types';
import { PREMIUM_FEATURE_FLAGS } from '@/constants/premium';
import { k } from '@/locales/keys';

/**
 * Nouveau Premium (#79), the pure part: what the person's Premium status is (from RevenueCat's
 * `premium` entitlement and admin grants in `feature_subscriptions`), and the paywall's numbers
 * and labels (savings, trial length, renewal wording). Labels come back as locale keys with their
 * params, so `scripts/check-premium.ts` can test them without i18n.
 */

export type PremiumPlan = 'monthly' | 'yearly';

/** RevenueCat's `PeriodType` for an entitlement. */
export type PremiumPeriodType = 'NORMAL' | 'INTRO' | 'TRIAL' | 'PREPAID';

/** The `premium` entitlement, as `lib/purchases.ts` reads it from the customer info. */
export interface PremiumEntitlementSnapshot {
  isActive: boolean;
  willRenew: boolean;
  periodType: PremiumPeriodType;
  /** ISO date; null for a lifetime grant from RevenueCat. */
  expirationDate: string | null;
  productIdentifier: string;
}

/** An admin grant (`feature_subscriptions` row joined with its `features` row). */
export interface PremiumGrantSnapshot {
  status: string;
  revoked_at: string | null;
  granted_at?: string | null;
  feature?: { flag: string } | null;
}

export type PremiumStatus =
  | { kind: 'free' }
  /** Bought in the App Store or Google Play (RevenueCat's entitlement is active). */
  | {
      kind: 'store';
      plan: PremiumPlan | null;
      isTrial: boolean;
      willRenew: boolean;
      expiresAt: string | null;
    }
  /** Given by an admin (a comp, e.g. the App Review demo account), no store subscription. */
  | { kind: 'granted'; grantedAt: string | null };

/** A store product id as a plan (`nouveau_premium_yearly`, `…_monthly:base-plan` on Android). */
export function getPlanForProductId(productId: string | null | undefined): PremiumPlan | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes('yearly') || id.includes('annual')) return 'yearly';
  if (id.includes('monthly')) return 'monthly';
  return null;
}

/** A grant counts while it's active and not revoked. */
export function isGrantActive(grant: PremiumGrantSnapshot): boolean {
  return grant.status === 'active' && !grant.revoked_at;
}

/** A grant for one of the Premium features (`PREMIUM_FEATURE_FLAGS`), not e.g. `excel`. */
export function isPremiumGrant(grant: PremiumGrantSnapshot): boolean {
  const flag = grant.feature?.flag;
  return !!flag && (PREMIUM_FEATURE_FLAGS as readonly string[]).includes(flag);
}

/**
 * Premium is active when the store entitlement is, or an active admin grant for a Premium feature
 * is. A store subscription wins, since it's the one with dates and a renewal to show.
 */
export function getPremiumStatus(
  entitlement: PremiumEntitlementSnapshot | null | undefined,
  grants: readonly PremiumGrantSnapshot[] | null | undefined,
): PremiumStatus {
  if (entitlement?.isActive) {
    return {
      kind: 'store',
      plan: getPlanForProductId(entitlement.productIdentifier),
      isTrial: entitlement.periodType === 'TRIAL',
      willRenew: entitlement.willRenew,
      expiresAt: entitlement.expirationDate,
    };
  }
  const grant = grants?.find((g) => isGrantActive(g) && isPremiumGrant(g));
  if (grant) return { kind: 'granted', grantedAt: grant.granted_at ?? null };
  return { kind: 'free' };
}

export function isPremiumActive(status: PremiumStatus): boolean {
  return status.kind !== 'free';
}

/** A locale key and its interpolation params. */
export interface LabelKey {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * The Settings Premium screen's status: the title ("Premium Yearly") and the line under it
 * ("Renews Mar 4, 2027", "Free trial ends …", "Expires …"). `formatDate` renders an ISO date.
 * During a trial that converts, `renewalPrice` ("Rp99,000/year", from the store product) says
 * what it becomes: "Free trial ends Mar 4, 2027, then Rp99,000/year"; without it, just the date.
 */
export function getPremiumStatusLabels(
  status: PremiumStatus,
  formatDate: (iso: string) => string,
  renewalPrice?: string | null,
): { title: LabelKey; detail: LabelKey | null } {
  if (status.kind === 'free') return { title: { key: k.premium.status.free }, detail: null };
  if (status.kind === 'granted') {
    return {
      title: { key: k.premium.status.granted },
      detail: { key: k.premium.status.grantedDetail },
    };
  }
  const title = {
    key:
      status.plan === 'yearly'
        ? k.premium.status.yearly
        : status.plan === 'monthly'
          ? k.premium.status.monthly
          : k.premium.status.premium,
  };
  if (!status.expiresAt) return { title, detail: null };
  const date = formatDate(status.expiresAt);
  // A trial that won't convert ends like any cancelled subscription: on its expiry date.
  const detailKey = !status.willRenew
    ? k.premium.status.expires
    : status.isTrial
      ? k.premium.status.trialEnds
      : k.premium.status.renews;
  if (detailKey === k.premium.status.trialEnds && renewalPrice) {
    return {
      title,
      detail: { key: k.premium.status.trialEndsThen, params: { date, price: renewalPrice } },
    };
  }
  return { title, detail: { key: detailKey, params: { date } } };
}

/** Settings' Premium row value: Free, Trial or Active. */
export function getPremiumRowValueKey(status: PremiumStatus): string {
  if (status.kind === 'free') return k.premium.rowValue.free;
  if (status.kind === 'store' && status.isTrial) return k.premium.rowValue.trial;
  return k.premium.rowValue.active;
}

/**
 * How much the yearly plan saves against twelve months of the monthly one, in whole percent
 * rounded down (never overstated): Rp10,000/month and Rp99,000/year save 17%. Null when there's
 * no saving or the prices are missing.
 */
export function getYearlySavingsPercent(
  monthlyPrice: number | null | undefined,
  yearlyPrice: number | null | undefined,
): number | null {
  if (!monthlyPrice || !yearlyPrice || monthlyPrice <= 0 || yearlyPrice <= 0) return null;
  const percent = Math.floor((1 - yearlyPrice / (monthlyPrice * 12)) * 100 + 1e-9);
  return percent > 0 ? percent : null;
}

/** A store billing period (`introPrice.periodUnit` / `PricingPhase.billingPeriod.unit`). */
export interface TrialPeriod {
  unit: string;
  count: number;
}

/**
 * A free trial's length as a label: days (a week counts as 7 days, as App Store Connect's
 * "1 week" trial is the 7-day one) or months. Null for no trial or a unit we can't name.
 */
export function getTrialDurationLabel(period: TrialPeriod | null | undefined): LabelKey | null {
  if (!period || period.count <= 0) return null;
  switch (period.unit.toUpperCase()) {
    case 'DAY':
      return { key: k.premium.duration.days, params: { count: period.count } };
    case 'WEEK':
      return { key: k.premium.duration.days, params: { count: period.count * 7 } };
    case 'MONTH':
      return { key: k.premium.duration.months, params: { count: period.count } };
    case 'YEAR':
      return { key: k.premium.duration.months, params: { count: period.count * 12 } };
    default:
      return null;
  }
}

/** "%{price}/month" or "%{price}/year". */
export function getPlanPriceKey(plan: PremiumPlan): string {
  return plan === 'yearly' ? k.premium.perYear : k.premium.perMonth;
}

export function getPlanTitleKey(plan: PremiumPlan): string {
  return plan === 'yearly' ? k.premium.yearly : k.premium.monthly;
}

/** The paywall's primary button: Start Free Trial when the store offers one, else Subscribe. */
export function getPrimaryActionKey(isTrialEligible: boolean): string {
  return isTrialEligible ? k.premium.startTrial : k.premium.subscribe;
}

/** The renewal disclosure (price per period, auto-renewal, cancel in store settings). */
export function getDisclosureKey(isTrialEligible: boolean): string {
  return isTrialEligible ? k.premium.disclosureTrial : k.premium.disclosure;
}

/** The store's name for "cancel in your … settings". */
export function getStoreNameKey(os: string): string {
  return os === 'ios' ? k.premium.storeApple : k.premium.storeGoogle;
}

/** What the paywall lists, in order, each with its symbol. */
export const PREMIUM_BENEFITS = [
  {
    titleKey: k.premium.benefits.autoCategorize,
    bodyKey: k.premium.benefits.autoCategorizeBody,
    symbol: { sf: 'wand.and.stars', material: 'auto_awesome' },
  },
  {
    titleKey: k.premium.benefits.scanReceipts,
    bodyKey: k.premium.benefits.scanReceiptsBody,
    symbol: { sf: 'doc.viewfinder', material: 'document_scanner' },
  },
  {
    titleKey: k.premium.benefits.proofs,
    bodyKey: k.premium.benefits.proofsBody,
    symbol: { sf: 'paperclip', material: 'attach_file' },
  },
] as const satisfies readonly { titleKey: string; bodyKey: string; symbol: FormSymbol }[];

/** Where the paywall was opened from (`source` route param). */
export const PAYWALL_SOURCES = ['onboarding', 'feature', 'settings'] as const;
export type PaywallSource = (typeof PAYWALL_SOURCES)[number];

/** The Premium features a tap can be held for (`feature` route param). */
export const PREMIUM_FEATURES = ['scanReceipt', 'autoCategorize', 'proofs'] as const;
export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The `source` param; anything unknown is `settings` (no Not Now, no feature to return to). */
export function parsePaywallSource(value: string | string[] | undefined): PaywallSource {
  const raw = firstParam(value);
  return (PAYWALL_SOURCES as readonly string[]).includes(raw ?? '')
    ? (raw as PaywallSource)
    : 'settings';
}

export function parsePremiumFeature(value: string | string[] | undefined): PremiumFeature | null {
  const raw = firstParam(value);
  return (PREMIUM_FEATURES as readonly string[]).includes(raw ?? '')
    ? (raw as PremiumFeature)
    : null;
}

/**
 * A moneymail 403 for a Premium feature (`code: "premium_required"`): the paywall opens instead
 * of an error alert. Matches the `ApiError` (`lib/api.ts`) by shape, so this stays pure. The
 * server checks Premium first, then AI consent: `isAiConsentRequiredError` (`utils/ai-consent.ts`).
 */
export function isPremiumRequiredError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { status, code } = error as { status?: unknown; code?: unknown };
  return code === 'premium_required' && (status === undefined || status === 403);
}

/**
 * Whether the onboarding paywall should be presented now: the account it was queued for is the
 * one signed in, the tabs are settled, Premium can be sold in this build, its status is known and
 * not already active, and it hasn't been shown to this account before.
 */
export function shouldPresentOnboardingPaywall(input: {
  pendingFor: string | null;
  userId: string | null;
  shownTo: readonly string[];
  isSettled: boolean;
  isAvailable: boolean;
  isStatusLoading: boolean;
  isPremium: boolean;
}): boolean {
  const { pendingFor, userId } = input;
  if (!pendingFor || !userId || pendingFor !== userId) return false;
  if (input.shownTo.includes(userId)) return false;
  if (!input.isSettled || !input.isAvailable || input.isStatusLoading) return false;
  return !input.isPremium;
}
