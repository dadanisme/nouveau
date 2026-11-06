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
 * `href` if that's it, or replaces it with `href`. For the auth redirects, so Login is never left
 * on top of the tabs (a signed-out cold deep link opens over them) and the tabs never on top of
 * Login.
 *
 * Expo Router's navigation calls take no animation option: the screen pushed takes its own
 * `animation`, so a redirect that mustn't animate (AuthGuard's cold-launch pass) sets it there.
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.dismissTo(href);
}
