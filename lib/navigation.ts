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

/** Where `leaveToHome` goes: the tab shell, or signed out the signed-out start. Kept by `useAuthRoutes`. */
let homeHref: Href = '/';

/** For `useAuthRoutes`: the tabs (`/`) with access to the app, otherwise `signedOutHref`. */
export function setHomeHref(href: Href) {
  homeHref = href;
}

/**
 * Leaves a screen open to everyone (the share screen) for home. With access to the app that's the
 * tab shell: pops to it (anchored under the screen on a cold link), or replaces the screen with it
 * when Android's share intent replaced the tabs. Signed out (no account, no guest) the tabs are
 * guarded, so the screen and anything over it are replaced by the signed-out start (the value
 * pages, or Welcome), with nothing left to go back to.
 */
export function leaveToHome() {
  if (homeHref === '/') router.dismissTo('/');
  else resetTo(homeHref);
}
