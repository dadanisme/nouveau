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

/** Where the store's own subscription management lives, when the SDK can't open it in place. */
export const STORE_SUBSCRIPTIONS_URLS = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions?package=com.muhammadramdan.nouveau',
} as const;
