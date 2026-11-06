import { type Href, useGlobalSearchParams, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useGuestSession, useSession } from '@/hooks/use-auth';
import { useCurrencyStepNeeded } from '@/hooks/use-currency-step-needed';
import { resetTo } from '@/lib/navigation';
import { markOnboardingSeen, readOnboardingSeen, subscribeOnboardingSeen } from '@/lib/onboarding';

/** A brand-new account's currency step, shown once per sign-in. */
const ACCOUNT_CURRENCY_STEP: Href = '/onboarding/currency?for=account';

/** Root routes open to signed-out people only (and to an account during its currency step). */
const ENTRY_ROUTES = new Set(['onboarding', 'login', 'signup']);
/** Root routes open to everyone: an incoming share intent, and Settings' View Introduction. */
const SHARED_ROUTES = new Set(['shareintent', 'introduction']);

/** If the first screen never reports focus, the splash still goes after this long. */
const SPLASH_FALLBACK_MS = 3000;

export interface AuthRoutes {
  /**
   * The first session read is done (a guest is known at once), so the guards are right and the
   * root Stack can mount. Until then nothing renders and the native splash stays up.
   */
  isReady: boolean;
  /** `Stack.Protected` guard for the tabs and every in-app route: signed in, or a guest. */
  canUseApp: boolean;
  /** `Stack.Protected` guard for onboarding, Login and Signup. */
  canUseEntry: boolean;
  /** Where a signed-out person lands: the value pages on a fresh install, Welcome after. */
  signedOutHref: Href;
  /** The splash is down; until then the screens the guards redirect to don't animate in. */
  isLaunched: boolean;
  /** For the root Stack's `focus` listener: the first open route to focus hides the splash. */
  onRouteFocus: (routeName: string) => void;
}

/**
 * The root Stack's protected routes (#78). The guards pick the screen, so the first one rendered is
 * the right one and no redirect runs on top of it:
 * - Signed in or a guest (#100): the tabs and the in-app routes. A cold launch opens on the tabs
 *   (the anchor), or on a deep link over them.
 * - Signed out: onboarding, Login and Signup. The tabs (the route a cold launch starts on) are
 *   guarded, so they render a redirect to `signedOutHref` instead of their screens.
 * - Both: a share intent and the introduction replay.
 * When a guard flips mid-session (sign in, Get Started, sign out), the focused screen that lost
 * access redirects (expo-router replaces it, with the incoming screen's animation) and the others
 * are dropped. Entry routes stay open while a new sign-in's currency check runs, so Login waits for
 * it, and while a brand-new account needs the currency step, which it's sent to once.
 *
 * The native splash stays up until the first open route has focused (its screen is mounted), with
 * a timed fallback so it can never stay up for good.
 */
export function useAuthRoutes(): AuthRoutes {
  const { session, isLoading } = useSession();
  const { guestId } = useGuestSession();
  const isSignedIn = !!session || !!guestId;
  const userId = session?.user.id ?? null;
  const currencyStep = useCurrencyStepNeeded();
  const hasSeenOnboarding = useSyncExternalStore(subscribeOnboardingSeen, readOnboardingSeen);
  const segments = useSegments();
  const params = useGlobalSearchParams<{ for?: string }>();

  // Only the first read gates rendering: a later refetch (the cache is cleared on sign-out) must
  // not unmount the app.
  const [isReady, setIsReady] = useState(false);
  if (!isReady && (!!guestId || !isLoading)) setIsReady(true);

  const canUseApp = isSignedIn;
  const canUseEntry = !isSignedIn || currencyStep.isChecking || currencyStep.isNeeded;

  // The account the currency step was shown to, so it's offered once per sign-in.
  const currencyStepShownTo = useRef<string | null>(null);
  const [root, child] = segments as string[];
  const onAccountCurrencyStep =
    root === 'onboarding' && child === 'currency' && params.for === 'account';

  useEffect(() => {
    if (!isSignedIn) {
      currencyStepShownTo.current = null;
      return;
    }
    // Someone who has used the app returns to Welcome after signing out, not the value pages.
    markOnboardingSeen();
    if (!currencyStep.isNeeded || !userId || currencyStepShownTo.current === userId) return;
    currencyStepShownTo.current = userId;
    if (!onAccountCurrencyStep) resetTo(ACCOUNT_CURRENCY_STEP);
  }, [isSignedIn, userId, currencyStep.isNeeded, onAccountCurrencyStep]);

  const [isLaunched, setIsLaunched] = useState(false);
  const isHidingSplash = useRef(false);

  const hideSplash = useCallback(() => {
    if (isHidingSplash.current) return;
    isHidingSplash.current = true;
    // A frame for the focused screen's first draw, then the system splash goes.
    requestAnimationFrame(() => {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setIsLaunched(true));
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const timeout = setTimeout(hideSplash, SPLASH_FALLBACK_MS);
    return () => clearTimeout(timeout);
  }, [isReady, hideSplash]);

  function onRouteFocus(routeName: string) {
    const isOpen = SHARED_ROUTES.has(routeName)
      ? true
      : ENTRY_ROUTES.has(routeName)
        ? canUseEntry
        : canUseApp;
    if (isOpen) hideSplash();
  }

  return {
    isReady,
    canUseApp,
    canUseEntry,
    signedOutHref: hasSeenOnboarding ? '/onboarding/welcome' : '/onboarding',
    isLaunched,
    onRouteFocus,
  };
}
