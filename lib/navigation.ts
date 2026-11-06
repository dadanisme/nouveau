import { router, type Href } from 'expo-router';

/**
 * Leaves the current screen: goes back when there's a screen behind it, otherwise replaces it with
 * the tab shell. The root Stack anchors the tabs under a route opened cold from a deep link
 * (`nouveau://add-transaction`), but a route that replaced the tabs still has nothing behind it, so
 * a plain `router.back()` from its Cancel or Close wouldn't be handled.
 */
export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Leaves `href` as the only screen in the root Stack: pops to the bottom screen, then returns to
 * `href` if that's it, or replaces it with `href`. For the root Stack's protected routes
 * (`useAuthRoutes`): the handover after sign-in or sign-out, and back to the tabs once a brand-new
 * account's currency step is saved. Not for a route nested under one already in the Stack (the
 * currency step, under onboarding): the pop lands on that route and the nested change slides in.
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.dismissTo(href);
}
