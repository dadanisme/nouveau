import { Linking, Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  PREMIUM_ENTITLEMENT_ID,
  PREMIUM_OFFERING_ID,
  PREMIUM_PRODUCT_IDS,
  STORE_SUBSCRIPTIONS_URLS,
} from '@/constants/premium';
import type { PremiumEntitlementSnapshot, PremiumPlan, TrialPeriod } from '@/utils/premium';

/**
 * RevenueCat (`react-native-purchases`) for Nouveau Premium (#79). The API key is per store
 * (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`). Only a development
 * build (`__DEV__`) falls back to the RevenueCat Test Store key
 * (`EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY`), on both platforms; a release build never uses it,
 * since Test Store purchases aren't real. With no key (or a dev client built before the native
 * module was added) Premium is unavailable: nothing is configured, every call here resolves to
 * "nothing", and the paywall says plans can't be loaded.
 *
 * The RevenueCat app user id is the Supabase user id. The SDK is configured the first time an
 * account signs in, with that id; later sign-ins `logIn`, and sign-out `logOut`s, after which
 * RevenueCat holds an anonymous user until the next sign-in. A guest never logs in to RevenueCat
 * and can never purchase: the paywall only sells while RevenueCat is identified as the signed-in
 * account (`usePurchasesIdentity`).
 */

// Inlined at build time: `EXPO_PUBLIC_*` must be read as literal member expressions.
const STORE_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const TEST_STORE_KEY = __DEV__ ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY : undefined;
const API_KEY = STORE_KEY || TEST_STORE_KEY || null;

/** The SDK's state: configured once, then identified as one account or none. */
let configured = false;
let configureFailed = false;
let identifiedUserId: string | null = null;
const customerInfoListeners = new Set<CustomerInfoUpdateListener>();

/** Whether this build can sell Premium at all: a key is set and the SDK didn't fail to start. */
export function isPurchasesAvailable(): boolean {
  return !!API_KEY && !configureFailed;
}

function configure(appUserID: string): boolean {
  if (configured) return true;
  if (!isPurchasesAvailable()) return false;
  try {
    Purchases.configure({ apiKey: API_KEY!, appUserID });
    if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.WARN).catch(() => {});
    Purchases.addCustomerInfoUpdateListener((info) => {
      customerInfoListeners.forEach((listener) => listener(info));
    });
    configured = true;
  } catch (error) {
    // A dev client without the native module (rebuild needed), or a malformed key.
    configureFailed = true;
    console.warn('RevenueCat could not be configured; Premium is unavailable', error);
  }
  return configured;
}

/**
 * Points RevenueCat at the signed-in account (`userId`), or at nobody after a sign-out. Resolves
 * the id it's now identified as (null when signed out or unavailable). Failures are logged and
 * leave the previous identity; the next session change tries again.
 */
export function identifyPurchases(userId: string | null): Promise<string | null> {
  // One change at a time, in order: a quick sign-out and sign-in can't interleave logOut/logIn.
  const next = identityQueue.then(() => applyIdentity(userId));
  identityQueue = next.catch(() => null);
  return next;
}

let identityQueue: Promise<unknown> = Promise.resolve();

async function applyIdentity(userId: string | null): Promise<string | null> {
  if (userId === identifiedUserId) return identifiedUserId;
  if (!userId) {
    if (configured && identifiedUserId) {
      identifiedUserId = null;
      try {
        await Purchases.logOut();
      } catch (error) {
        console.warn('RevenueCat logOut failed', error);
      }
    }
    return null;
  }
  if (!configured) {
    if (!configure(userId)) return null;
    identifiedUserId = userId;
    return userId;
  }
  try {
    await Purchases.logIn(userId);
    identifiedUserId = userId;
  } catch (error) {
    console.warn('RevenueCat logIn failed', error);
  }
  return identifiedUserId;
}

/** Every customer-info update from the SDK (renewals, purchases elsewhere, expiry). */
export function subscribeCustomerInfo(listener: CustomerInfoUpdateListener): () => void {
  customerInfoListeners.add(listener);
  return () => {
    customerInfoListeners.delete(listener);
  };
}

/** The `premium` entitlement as the pure status logic reads it, or null when there's none. */
export function toEntitlementSnapshot(
  info: CustomerInfo | null | undefined,
): PremiumEntitlementSnapshot | null {
  const entitlement = info?.entitlements.all[PREMIUM_ENTITLEMENT_ID];
  if (!entitlement) return null;
  return {
    isActive: entitlement.isActive,
    willRenew: entitlement.willRenew,
    periodType: entitlement.periodType,
    expirationDate: entitlement.expirationDate,
    productIdentifier: entitlement.productIdentifier,
  };
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

/** A plan's package from the `default` offering, with whether its free trial is offered. */
export interface PremiumPackage {
  plan: PremiumPlan;
  pkg: PurchasesPackage;
  /** The store says this account can start the introductory free trial. */
  isTrialEligible: boolean;
  /** The free trial's length, when the product has one. */
  trialPeriod: TrialPeriod | null;
}

export interface PremiumOffering {
  monthly: PremiumPackage | null;
  yearly: PremiumPackage | null;
}

/** A product's free trial (an introductory offer at price 0), as a period, or null. */
function getFreeTrialPeriod(pkg: PurchasesPackage): TrialPeriod | null {
  const { introPrice, defaultOption } = pkg.product;
  if (introPrice && introPrice.price === 0) {
    return { unit: introPrice.periodUnit, count: introPrice.periodNumberOfUnits };
  }
  const free = defaultOption?.freePhase;
  if (free) return { unit: free.billingPeriod.unit, count: free.billingPeriod.value };
  return null;
}

function findPackage(packages: PurchasesPackage[], productId: string) {
  // Android product ids carry the base plan after a colon (`nouveau_premium_monthly:monthly`).
  return packages.find(
    (pkg) =>
      pkg.product.identifier === productId || pkg.product.identifier.startsWith(`${productId}:`),
  );
}

/**
 * The two Premium plans from the `default` offering (or the current one), with trial eligibility:
 * iOS asks StoreKit (an unknown answer shows no trial, so the paywall never promises one it can't
 * give); Google Play only returns offers the account is eligible for, so a free phase means yes.
 * Null when Premium is unavailable or the offering has neither product.
 */
export async function getPremiumOffering(): Promise<PremiumOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[PREMIUM_OFFERING_ID] ?? offerings.current;
  if (!offering) return null;
  const packages = offering.availablePackages;
  const monthly = findPackage(packages, PREMIUM_PRODUCT_IDS.monthly) ?? offering.monthly;
  const yearly = findPackage(packages, PREMIUM_PRODUCT_IDS.yearly) ?? offering.annual;
  if (!monthly && !yearly) return null;

  let eligibility: Record<string, { status: INTRO_ELIGIBILITY_STATUS }> = {};
  if (Platform.OS === 'ios') {
    const ids = [monthly, yearly].flatMap((pkg) => (pkg ? [pkg.product.identifier] : []));
    eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids).catch(() => ({}));
  }
  const toPlan = (plan: PremiumPlan, pkg: PurchasesPackage | null): PremiumPackage | null => {
    if (!pkg) return null;
    const isEligible =
      Platform.OS === 'ios'
        ? eligibility[pkg.product.identifier]?.status ===
          INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        : true;
    const trialPeriod = getFreeTrialPeriod(pkg);
    return { plan, pkg, isTrialEligible: isEligible && !!trialPeriod, trialPeriod };
  };

  return { monthly: toPlan('monthly', monthly), yearly: toPlan('yearly', yearly) };
}

/**
 * How a purchase ended: bought (with the new customer info), cancelled in the store sheet, or
 * pending: a deferred payment (Google Play's pay-at-a-store, a parent's Ask to Buy) that turns
 * Premium on later, through a customer-info update, once it completes.
 */
export type PurchaseOutcome =
  | { kind: 'purchased'; info: CustomerInfo }
  | { kind: 'cancelled' }
  | { kind: 'pending' };

function getErrorCode(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  return (error as { code?: unknown }).code;
}

function isCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { userCancelled } = error as { userCancelled?: unknown };
  return (
    getErrorCode(error) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || userCancelled === true
  );
}

function isPending(error: unknown): boolean {
  return getErrorCode(error) === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR;
}

/**
 * Buying and restoring need RevenueCat identified as an account: after a sign-out it holds an
 * anonymous user, and a purchase made there would belong to nobody.
 */
function assertIdentified() {
  if (!configured) throw new Error('Purchases are not available');
  if (!identifiedUserId) throw new Error('Sign in to buy or restore Premium');
}

export async function purchasePremium(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  assertIdentified();
  try {
    const result = await Purchases.purchasePackage(pkg);
    return { kind: 'purchased', info: result.customerInfo };
  } catch (error) {
    if (isCancelled(error)) return { kind: 'cancelled' };
    if (isPending(error)) return { kind: 'pending' };
    throw error;
  }
}

export async function restorePremium(): Promise<CustomerInfo> {
  assertIdentified();
  return Purchases.restorePurchases();
}

/**
 * Opens the store's subscription management: App Store's sheet in place on iOS, otherwise the
 * customer's management URL or the store's subscriptions page. Works without RevenueCat too
 * (Delete Account offers it to everyone).
 */
export async function openSubscriptionManagement(): Promise<void> {
  if (configured && Platform.OS === 'ios') {
    try {
      await Purchases.showManageSubscriptions();
      return;
    } catch (error) {
      console.warn('showManageSubscriptions failed; opening the App Store page', error);
    }
  }
  let url: string | null = null;
  if (configured) {
    url = (await Purchases.getCustomerInfo().catch(() => null))?.managementURL ?? null;
  }
  await Linking.openURL(
    url ??
      (Platform.OS === 'ios' ? STORE_SUBSCRIPTIONS_URLS.ios : STORE_SUBSCRIPTIONS_URLS.android),
  );
}
