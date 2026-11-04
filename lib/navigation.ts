import { router } from 'expo-router';

/**
 * Leaves the current screen: goes back when there's a screen behind it, otherwise replaces it with
 * the tab shell. A route opened cold from a deep link (`nouveau://add-transaction`) has nothing
 * behind it, so a plain `router.back()` from its Cancel or Close isn't handled.
 */
export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
