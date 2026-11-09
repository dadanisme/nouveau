/**
 * Checks Nouveau Premium's pure logic (#79, `utils/premium.ts`) and its strings:
 * - the status: store entitlement (plan, trial, renewal), admin grants (Premium flags only, not
 *   e.g. `excel`), store over grant, revoked;
 * - the status labels (Free, Premium Yearly, renews / trial ends / expires <date>, granted);
 * - the yearly saving (rounded down), trial lengths (a week is 7 days), plan and button keys;
 * - the route params, the `premium_required` error, and when the onboarding paywall presents;
 * - every `premium.*` string in en and id with the same placeholders, rendered through i18n-js,
 *   and the Android sentence-case lines for the Title Case labels.
 *
 * Run: bun scripts/check-premium.ts (exits 1 on any failure).
 */
import { I18n } from 'i18n-js';

import { androidOverrides } from '../locales/android';
import en from '../locales/en';
import id from '../locales/id';
import {
  getDisclosureKey,
  getPlanForProductId,
  getPlanPriceKey,
  getPlanTitleKey,
  getPremiumRowValueKey,
  getPremiumStatus,
  getPremiumStatusLabels,
  getPrimaryActionKey,
  getStoreNameKey,
  getTrialDurationLabel,
  getYearlySavingsPercent,
  isPremiumActive,
  isPremiumRequiredError,
  parsePaywallSource,
  parsePremiumFeature,
  PREMIUM_BENEFITS,
  shouldPresentOnboardingPaywall,
  type PremiumEntitlementSnapshot,
  type PremiumStatus,
} from '../utils/premium';

let passes = 0;
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passes += 1;
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
}

function equal(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, `got ${a}, expected ${e}`);
}

/** The value at a dot-path key, or undefined. */
function lookup(tree: unknown, key: string): unknown {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function hasString(tree: unknown, key: string): boolean {
  const value = lookup(tree, key);
  if (typeof value === 'string') return !!value.trim();
  // A plural string: `{ one, other }`.
  return typeof value === 'object' && value !== null && 'one' in value && 'other' in value;
}

// --- Status ---------------------------------------------------------------------------------

const yearlyTrial: PremiumEntitlementSnapshot = {
  isActive: true,
  willRenew: true,
  periodType: 'TRIAL',
  expirationDate: '2026-11-15T10:00:00Z',
  productIdentifier: 'nouveau_premium_yearly',
};
const monthlyCancelled: PremiumEntitlementSnapshot = {
  isActive: true,
  willRenew: false,
  periodType: 'NORMAL',
  expirationDate: '2026-12-08T10:00:00Z',
  productIdentifier: 'nouveau_premium_monthly:monthly',
};
const expired: PremiumEntitlementSnapshot = { ...monthlyCancelled, isActive: false };
const scanFeature = { flag: 'receipt_scanning' };
const activeGrant = {
  status: 'active',
  revoked_at: null,
  granted_at: '2026-01-02T00:00:00Z',
  feature: scanFeature,
};
const revokedGrant = {
  status: 'revoked',
  revoked_at: '2026-02-01T00:00:00Z',
  feature: scanFeature,
};
const revokedButActive = {
  status: 'active',
  revoked_at: '2026-02-01T00:00:00Z',
  feature: scanFeature,
};
const classifyGrant = {
  status: 'active',
  revoked_at: null,
  granted_at: '2026-03-01T00:00:00Z',
  feature: { flag: 'description_classification' },
};
const excelGrant = {
  status: 'active',
  revoked_at: null,
  granted_at: '2026-04-01T00:00:00Z',
  feature: { flag: 'excel' },
};
const noFeatureGrant = { status: 'active', revoked_at: null, granted_at: null, feature: null };

equal('no entitlement, no grants: free', getPremiumStatus(null, []), { kind: 'free' });
equal('undefined everything: free', getPremiumStatus(undefined, undefined), { kind: 'free' });
equal('active yearly trial', getPremiumStatus(yearlyTrial, []), {
  kind: 'store',
  plan: 'yearly',
  isTrial: true,
  willRenew: true,
  expiresAt: '2026-11-15T10:00:00Z',
});
equal('Android product id with a base plan', getPremiumStatus(monthlyCancelled, null), {
  kind: 'store',
  plan: 'monthly',
  isTrial: false,
  willRenew: false,
  expiresAt: '2026-12-08T10:00:00Z',
});
equal('expired entitlement: free', getPremiumStatus(expired, []), { kind: 'free' });
equal('expired entitlement + grant: granted', getPremiumStatus(expired, [activeGrant]), {
  kind: 'granted',
  grantedAt: '2026-01-02T00:00:00Z',
});
check('store wins over a grant', getPremiumStatus(yearlyTrial, [activeGrant]).kind === 'store');
equal('revoked grant: free', getPremiumStatus(null, [revokedGrant]), { kind: 'free' });
equal('active status with revoked_at: free', getPremiumStatus(null, [revokedButActive]), {
  kind: 'free',
});
check(
  'a revoked grant before an active one still counts the active one',
  getPremiumStatus(null, [revokedGrant, activeGrant]).kind === 'granted',
);
equal('classification grant: granted', getPremiumStatus(null, [classifyGrant]), {
  kind: 'granted',
  grantedAt: '2026-03-01T00:00:00Z',
});
equal('excel-only grant: free', getPremiumStatus(null, [excelGrant]), { kind: 'free' });
equal('grant without its feature row: free', getPremiumStatus(null, [noFeatureGrant]), {
  kind: 'free',
});
equal(
  'excel grant before a Premium grant: the Premium one',
  getPremiumStatus(null, [excelGrant, activeGrant]),
  {
    kind: 'granted',
    grantedAt: '2026-01-02T00:00:00Z',
  },
);
check('free is not active', !isPremiumActive({ kind: 'free' }));
check('granted is active', isPremiumActive({ kind: 'granted', grantedAt: null }));

equal('plan: yearly', getPlanForProductId('nouveau_premium_yearly'), 'yearly');
equal('plan: monthly', getPlanForProductId('nouveau_premium_monthly'), 'monthly');
equal('plan: annual alias', getPlanForProductId('com.x.annual'), 'yearly');
equal('plan: unknown', getPlanForProductId('nouveau_lifetime'), null);
equal('plan: missing', getPlanForProductId(undefined), null);

// --- Labels ---------------------------------------------------------------------------------

const fmt = (iso: string) => `<${iso.slice(0, 10)}>`;
const store = (overrides: Partial<Extract<PremiumStatus, { kind: 'store' }>>): PremiumStatus => ({
  kind: 'store',
  plan: 'yearly',
  isTrial: false,
  willRenew: true,
  expiresAt: '2027-03-04T00:00:00Z',
  ...overrides,
});

equal('label: free', getPremiumStatusLabels({ kind: 'free' }, fmt), {
  title: { key: 'premium.status.free' },
  detail: null,
});
equal('label: granted', getPremiumStatusLabels({ kind: 'granted', grantedAt: null }, fmt), {
  title: { key: 'premium.status.granted' },
  detail: { key: 'premium.status.grantedDetail' },
});
equal('label: yearly renews', getPremiumStatusLabels(store({}), fmt), {
  title: { key: 'premium.status.yearly' },
  detail: { key: 'premium.status.renews', params: { date: '<2027-03-04>' } },
});
equal(
  'label: monthly trial ends',
  getPremiumStatusLabels(store({ plan: 'monthly', isTrial: true }), fmt),
  {
    title: { key: 'premium.status.monthly' },
    detail: { key: 'premium.status.trialEnds', params: { date: '<2027-03-04>' } },
  },
);
equal(
  'label: trial ends, then the renewal price',
  getPremiumStatusLabels(store({ isTrial: true }), fmt, 'Rp99,000/year').detail,
  {
    key: 'premium.status.trialEndsThen',
    params: { date: '<2027-03-04>', price: 'Rp99,000/year' },
  },
);
equal(
  'label: no store price, the trial line has just the date',
  getPremiumStatusLabels(store({ isTrial: true }), fmt, null).detail,
  { key: 'premium.status.trialEnds', params: { date: '<2027-03-04>' } },
);
equal(
  'label: a cancelled trial ignores the renewal price',
  getPremiumStatusLabels(store({ isTrial: true, willRenew: false }), fmt, 'Rp99,000/year').detail,
  { key: 'premium.status.expires', params: { date: '<2027-03-04>' } },
);
equal(
  'label: a renewing subscription ignores the renewal price',
  getPremiumStatusLabels(store({}), fmt, 'Rp99,000/year').detail,
  { key: 'premium.status.renews', params: { date: '<2027-03-04>' } },
);
equal(
  'label: cancelled trial expires',
  getPremiumStatusLabels(store({ isTrial: true, willRenew: false }), fmt).detail,
  { key: 'premium.status.expires', params: { date: '<2027-03-04>' } },
);
equal(
  'label: cancelled subscription expires',
  getPremiumStatusLabels(store({ willRenew: false }), fmt).detail,
  { key: 'premium.status.expires', params: { date: '<2027-03-04>' } },
);
equal('label: unknown plan', getPremiumStatusLabels(store({ plan: null }), fmt).title, {
  key: 'premium.status.premium',
});
equal(
  'label: no expiry date, no detail',
  getPremiumStatusLabels(store({ expiresAt: null }), fmt).detail,
  null,
);

equal('row value: free', getPremiumRowValueKey({ kind: 'free' }), 'premium.rowValue.free');
equal(
  'row value: trial',
  getPremiumRowValueKey(store({ isTrial: true })),
  'premium.rowValue.trial',
);
equal('row value: active', getPremiumRowValueKey(store({})), 'premium.rowValue.active');
equal(
  'row value: granted',
  getPremiumRowValueKey({ kind: 'granted', grantedAt: null }),
  'premium.rowValue.active',
);

// --- Paywall numbers and keys ---------------------------------------------------------------

equal('savings: Rp10,000/month vs Rp99,000/year', getYearlySavingsPercent(10000, 99000), 17);
equal('savings: $4.99 vs $39.99', getYearlySavingsPercent(4.99, 39.99), 33);
equal('savings: exactly 12x is none', getYearlySavingsPercent(10000, 120000), null);
equal('savings: dearer yearly is none', getYearlySavingsPercent(10000, 130000), null);
equal('savings: half price', getYearlySavingsPercent(10, 60), 50);
equal('savings: missing monthly', getYearlySavingsPercent(undefined, 99000), null);
equal('savings: zero monthly', getYearlySavingsPercent(0, 99000), null);
equal('savings: missing yearly', getYearlySavingsPercent(10000, null), null);

equal('trial: 7 days', getTrialDurationLabel({ unit: 'DAY', count: 7 }), {
  key: 'premium.duration.days',
  params: { count: 7 },
});
equal('trial: 1 week is 7 days', getTrialDurationLabel({ unit: 'WEEK', count: 1 }), {
  key: 'premium.duration.days',
  params: { count: 7 },
});
equal('trial: 2 weeks', getTrialDurationLabel({ unit: 'week', count: 2 }), {
  key: 'premium.duration.days',
  params: { count: 14 },
});
equal('trial: 1 month', getTrialDurationLabel({ unit: 'MONTH', count: 1 }), {
  key: 'premium.duration.months',
  params: { count: 1 },
});
equal('trial: 1 year', getTrialDurationLabel({ unit: 'YEAR', count: 1 }), {
  key: 'premium.duration.months',
  params: { count: 12 },
});
equal('trial: none', getTrialDurationLabel(null), null);
equal('trial: zero length', getTrialDurationLabel({ unit: 'DAY', count: 0 }), null);
equal('trial: unknown unit', getTrialDurationLabel({ unit: 'UNKNOWN', count: 3 }), null);

equal('price key: monthly', getPlanPriceKey('monthly'), 'premium.perMonth');
equal('price key: yearly', getPlanPriceKey('yearly'), 'premium.perYear');
equal('title key: yearly', getPlanTitleKey('yearly'), 'premium.yearly');
equal('button: trial', getPrimaryActionKey(true), 'premium.startTrial');
equal('button: subscribe', getPrimaryActionKey(false), 'premium.subscribe');
equal('disclosure: trial', getDisclosureKey(true), 'premium.disclosureTrial');
equal('disclosure: plain', getDisclosureKey(false), 'premium.disclosure');
equal('store: iOS', getStoreNameKey('ios'), 'premium.storeApple');
equal('store: Android', getStoreNameKey('android'), 'premium.storeGoogle');
check('three benefits', PREMIUM_BENEFITS.length === 3);
for (const benefit of PREMIUM_BENEFITS) {
  check(
    `benefit ${benefit.titleKey} has symbols`,
    !!benefit.symbol.sf && !!benefit.symbol.material,
  );
}

// --- Params, errors, onboarding -------------------------------------------------------------

equal('source: onboarding', parsePaywallSource('onboarding'), 'onboarding');
equal('source: feature', parsePaywallSource(['feature', 'settings']), 'feature');
equal('source: unknown', parsePaywallSource('promo'), 'settings');
equal('source: missing', parsePaywallSource(undefined), 'settings');
equal('feature: scanReceipt', parsePremiumFeature('scanReceipt'), 'scanReceipt');
equal('feature: unknown', parsePremiumFeature('export'), null);

check('403 premium_required', isPremiumRequiredError({ status: 403, code: 'premium_required' }));
check('code without status', isPremiumRequiredError({ code: 'premium_required' }));
check('500 is not', !isPremiumRequiredError({ status: 500, code: 'premium_required' }));
check('other code is not', !isPremiumRequiredError({ status: 403, code: 'forbidden' }));
check('plain Error is not', !isPremiumRequiredError(new Error('premium_required')));
check('null is not', !isPremiumRequiredError(null));

const ready = {
  pendingFor: 'u1',
  userId: 'u1',
  shownTo: [] as string[],
  isSettled: true,
  isAvailable: true,
  isStatusLoading: false,
  isPremium: false,
};
check('onboarding paywall: presents', shouldPresentOnboardingPaywall(ready));
check('not queued', !shouldPresentOnboardingPaywall({ ...ready, pendingFor: null }));
check('queued for someone else', !shouldPresentOnboardingPaywall({ ...ready, userId: 'u2' }));
check('signed out', !shouldPresentOnboardingPaywall({ ...ready, userId: null }));
check('already shown', !shouldPresentOnboardingPaywall({ ...ready, shownTo: ['u1'] }));
check('handover not over', !shouldPresentOnboardingPaywall({ ...ready, isSettled: false }));
check('no RevenueCat key', !shouldPresentOnboardingPaywall({ ...ready, isAvailable: false }));
check('status loading', !shouldPresentOnboardingPaywall({ ...ready, isStatusLoading: true }));
check('already Premium', !shouldPresentOnboardingPaywall({ ...ready, isPremium: true }));

// --- Strings --------------------------------------------------------------------------------

/** Every leaf key under `tree` (a plural object counts as one leaf). */
function leafKeys(tree: unknown, prefix: string): string[] {
  if (typeof tree !== 'object' || tree === null) return [prefix];
  if ('one' in tree && 'other' in tree) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => leafKeys(value, `${prefix}.${key}`));
}

function placeholders(value: unknown): string {
  return [...JSON.stringify(value).matchAll(/%\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
    .filter((name, index, all) => all.indexOf(name) === index)
    .join(',');
}

const PREMIUM_KEYS = [
  ...leafKeys(en.premium, 'premium'),
  'settings.premium',
  'signInPrompt.premiumTitle',
  'deleteAccount.subscriptionNote',
];
for (const key of PREMIUM_KEYS) {
  check(`${key} in en`, hasString(en, key));
  check(`${key} in id`, hasString(id, key));
  equal(`${key} placeholders match`, placeholders(lookup(id, key)), placeholders(lookup(en, key)));
}
check(
  'id has no extra premium keys',
  leafKeys(id.premium, 'premium').length === leafKeys(en.premium, 'premium').length,
);
check('subscriptions strings removed', !('subscriptions' in en) && !('subscriptions' in id));

// The keys the logic returns all exist.
const returnedKeys = [
  getPlanPriceKey('monthly'),
  getPlanPriceKey('yearly'),
  getPlanTitleKey('monthly'),
  getPlanTitleKey('yearly'),
  getPrimaryActionKey(true),
  getPrimaryActionKey(false),
  getDisclosureKey(true),
  getDisclosureKey(false),
  getStoreNameKey('ios'),
  getStoreNameKey('android'),
  ...PREMIUM_BENEFITS.flatMap((benefit) => [benefit.titleKey, benefit.bodyKey]),
];
for (const key of returnedKeys) check(`returned key ${key} exists`, hasString(en, key));

// Rendered through i18n-js, as the app does.
const i18n = new I18n({ en, id });
i18n.locale = 'en';
equal('render save', i18n.t('premium.save', { percent: 17 }), 'Save 17%');
equal('render 7 days', i18n.t('premium.duration.days', { count: 7 }), '7 days');
equal('render 1 month', i18n.t('premium.duration.months', { count: 1 }), '1 month');
equal(
  'render trial footer',
  i18n.t('premium.trialFooter', { duration: '7 days', price: 'Rp99,000/year' }),
  'Try it free for 7 days, then Rp99,000/year.',
);
check(
  'disclosure names the price, renewal and store',
  /Rp99,000\/year.*renews automatically|renews automatically.*Rp99,000\/year/.test(
    i18n.t('premium.disclosure', { price: 'Rp99,000/year', store: 'App Store' }),
  ) && i18n.t('premium.disclosure', { price: 'x', store: 'App Store' }).includes('App Store'),
);
i18n.locale = 'id';
equal('render save (id)', i18n.t('premium.save', { percent: 17 }), 'Hemat 17%');
equal('render 7 days (id)', i18n.t('premium.duration.days', { count: 7 }), '7 hari');

// Android sentence case for the Title Case labels.
function isSentenceCase(text: string, properNouns: readonly string[]): boolean {
  return text
    .split(/\s+/)
    .slice(1)
    .every(
      (word) =>
        properNouns.includes(word.replace(/[()]/g, '')) || word[0] === word[0]?.toLowerCase(),
    );
}
const PROPER_NOUNS = ['Premium', 'Nouveau', 'Anda'];
const TITLE_CASE_KEYS = [
  'premium.benefits.autoCategorize',
  'premium.benefits.scanReceipts',
  'premium.benefits.proofs',
  'premium.plansSection',
  'premium.startTrial',
  'premium.restore',
  'premium.notNow',
  'legal.terms',
  'legal.privacy',
  'premium.tryAgain',
  'premium.purchaseFailed',
  'premium.restoreFailed',
  'premium.nothingToRestore',
  'premium.paymentPending',
  'premium.notConfirmed',
  'premium.manage',
  'premium.status.monthly',
  'premium.status.yearly',
  'premium.status.granted',
  'signInPrompt.premiumTitle',
];
for (const key of TITLE_CASE_KEYS) {
  for (const locale of ['en', 'id'] as const) {
    const android = lookup(androidOverrides[locale], key);
    check(`${key} Android line in ${locale}`, typeof android === 'string' && !!android.trim());
    if (typeof android === 'string') {
      check(
        `${key} Android line in ${locale} is sentence case`,
        isSentenceCase(android, PROPER_NOUNS),
        android,
      );
    }
  }
}

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
