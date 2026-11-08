/**
 * Nouveau Premium (#79) in RevenueCat: one entitlement, two auto-renewing products (each with a
 * 7-day free trial as the store's introductory offer), served by the `default` offering.
 */
export const PREMIUM_ENTITLEMENT_ID = 'premium';
export const PREMIUM_OFFERING_ID = 'default';
export const PREMIUM_PRODUCT_IDS = {
  monthly: 'nouveau_premium_monthly',
  yearly: 'nouveau_premium_yearly',
} as const;

/**
 * The `features.flag`s Premium unlocks. An admin grant (`feature_subscriptions`) only makes the
 * account Premium when it's for one of these; a grant for another feature (e.g. `excel`) doesn't.
 */
export const PREMIUM_FEATURE_FLAGS = ['receipt_scanning', 'description_classification'] as const;

/** Where the store's own subscription management lives, when the SDK can't open it in place. */
export const STORE_SUBSCRIPTIONS_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions?package=com.muhammadramdan.nouveau',
} as const;
