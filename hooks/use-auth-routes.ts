import { type Href, router, useGlobalSearchParams, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { useGuestSession, useSession } from '@/hooks/use-auth';
import { useCurrencyStepNeeded } from '@/hooks/use-currency-step-needed';
import { resetTo, setHomeHref } from '@/lib/navigation';
import { markOnboardingSeen, readOnboardingSeen, subscribeOnboardingSeen } from '@/lib/onboarding';

/** A brand-new account's currency step, shown once per sign-in. */
const ACCOUNT_CURRENCY_STEP: Href = '/onboarding/currency?for=account';

/** The first-run flow: open signed out (and to an account during its currency step). */
const ONBOARDING_ROUTES = new Set(['onboarding']);
/**
 * Sign In and Sign Up: open without a session (signed out, or a guest, #100), and while a sign-in
 * settles (a guest's upload, an account's currency check or step).
 */
const SIGN_IN_ROUTES = new Set(['login', 'signup']);
/** The sign-in prompt sheet (#100), by its root Stack route name. */
const SIGN_IN_PROMPT_ROUTE = '(sheets)/sign-in-prompt';
/**
 * Root routes open to everyone: an incoming share intent, Settings' View Introduction, and the
 * sign-in prompt (#100), which a share intent opens before anyone has signed in.
 */
const SHARED_ROUTES = new Set(['shareintent', 'introduction', SIGN_IN_PROMPT_ROUTE]);

/** If the first screen never finishes appearing, the splash still goes after this long. */
const SPLASH_FALLBACK_MS = 3000;

export interface AuthRoutes {
  /**
   * The first session read is done (a guest is known at once), so the guards are right and the
   * root Stack can mount. Until then nothing renders and the native splash stays up.
   */
  isReady: boolean;
  /** `Stack.Protected` guard for the tabs and every in-app route: signed in, or a guest. */
  canUseApp: boolean;
  /** `Stack.Protected` guard for onboarding. */
  canUseOnboarding: boolean;
  /** `Stack.Protected` guard for Login and Signup. */
  canUseSignIn: boolean;
  /**
   * A guest's sign-in is handing over: their Login (or Signup), pushed over the tabs, fades out as
   * the handover pops back to them, like the other access changes, instead of sliding off.
   */
  fadesSignInOut: boolean;
  /** No handover, and the focused screen is in the app (the guest upload's notice waits for it). */
  isSettled: boolean;
  /** Where a signed-out person lands: the value pages on a fresh install, Welcome after. */
  signedOutHref: Href;
  /** The splash is down; until then the screens the guards redirect to don't animate in. */
  isLaunched: boolean;
  /**
   * For the root Stack's `transitionEnd` listener: a route has finished appearing. The first open
   * one hides the splash.
   */
  onRouteShown: (routeName: string) => void;
}

/** Which of the root Stack's `Stack.Protected` groups are open. */
interface Guards {
  app: boolean;
  onboarding: boolean;
  signIn: boolean;
}

/** Whether the root route (a route name, or the first URL segment) is open under `guards`. */
function isRouteOpen(routeName: string | undefined, guards: Guards): boolean {
  if (!routeName || SHARED_ROUTES.has(routeName)) return true;
  if (ONBOARDING_ROUTES.has(routeName)) return guards.onboarding;
  if (SIGN_IN_ROUTES.has(routeName)) return guards.signIn;
  return guards.app;
}

function sameGuards(a: Guards, b: Guards): boolean {
  return a.app === b.app && a.onboarding === b.onboarding && a.signIn === b.signIn;
}

/** Each group open in either. */
function eitherGuards(a: Guards, b: Guards): Guards {
  return {
    app: a.app || b.app,
    onboarding: a.onboarding || b.onboarding,
    signIn: a.signIn || b.signIn,
  };
}

/**
 * The root Stack's protected routes (#78). The guards pick the screen, so the first one rendered is
 * the right one and no redirect runs on top of it:
 * - Signed in or a guest (#100): the tabs and the in-app routes. A cold launch opens on the tabs
 *   (the anchor), or on a deep link over them.
 * - Signed out: onboarding, Login and Signup. The tabs (the route a cold launch starts on) are
 *   guarded, so they render a redirect to `signedOutHref` instead of their screens.
 * - A guest also gets Login and Signup (Settings' Sign In pushes Login over the tabs). Once they
 *   sign in, those stay open until the first upload of their device data has finished
 *   (`isUploading`, `useGuestUpload`), then the handover pops them back to the tabs.
 * - Both: a share intent and the introduction replay.
 * When the access changes mid-session (sign in, Get Started, sign out) and the focused screen loses
 * it, a guarded screen would swap its content for expo-router's redirect, a blank screen until the
 * next one slides in. So both groups stay open for a moment (the handover): the focused screen keeps
 * its content, `resetTo` replaces it with where the person now belongs (the incoming screen's
 * `fade`), and once that's focused the guards close and drop the rest. Onboarding, Login and Signup
 * stay open while a new sign-in's currency check runs, so Login waits for it, and while a brand-new
 * account needs the currency step, which it's sent to once.
 *
 * The native splash stays up until the first open route has finished appearing (`transitionEnd`,
 * not `focus`, which comes as soon as the route is in the state, well before its native screen is
 * on screen), with a timed fallback so it can never stay up for good. `isLaunched` turns on only
 * then, so a cold launch's redirect stays unanimated.
 */
export function useAuthRoutes({ isUploading }: { isUploading: boolean }): AuthRoutes {
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

  const isSettling = currencyStep.isChecking || currencyStep.isNeeded;
  const access: Guards = {
    app: isSignedIn,
    onboarding: !isSignedIn || isSettling,
    signIn: !session || isUploading || isSettling,
  };
  const [root, child] = segments as string[];
  // Sheet routes are named with their group (`(sheets)/sign-in-prompt`), as `onRouteShown` gets them.
  const rootRoute = root === '(sheets)' && child ? `${root}/${child}` : root;

  // The handover: the access before and after the change, both open, while the focused screen that
  // lost access is replaced. Derived during render, so the guard never closes on that screen.
  const [handover, setHandover] = useState<Guards | null>(null);
  // Whether the app was already open when the handover began (a guest signing in on a Login pushed
  // over the tabs), rather than the app replacing onboarding.
  const [handoverOverApp, setHandoverOverApp] = useState(false);
  const [lastAccess, setLastAccess] = useState(access);
  if (!sameGuards(lastAccess, access)) {
    setLastAccess(access);
    if (isReady && !isRouteOpen(rootRoute, access)) {
      setHandover(eitherGuards(handover ?? lastAccess, access));
      setHandoverOverApp((handover ?? lastAccess).app);
    }
  }
  if (handover && isRouteOpen(rootRoute, access)) setHandover(null);
  const guards = handover ?? access;
  const signedOutHref: Href = hasSeenOnboarding ? '/onboarding/welcome' : '/onboarding';
  const handoverHref = handover ? (access.app ? '/' : signedOutHref) : null;

  useEffect(() => {
    if (handoverHref) resetTo(handoverHref);
  }, [handoverHref]);

  // Where the share screen leaves for (`leaveToHome`).
  const homeHref: Href = access.app ? '/' : signedOutHref;
  useEffect(() => setHomeHref(homeHref), [homeHref]);

  // The account the currency step was shown to, so it's offered once per sign-in.
  const currencyStepShownTo = useRef<string | null>(null);
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
    // A replace of the focused root route (Login, Signup, or the tabs on a relaunch), not
    // `resetTo`: that pops back to the onboarding route under Login (Login slides off) and then
    // swaps Welcome for the step inside onboarding's own Stack (a blank frame, then a slide in).
    // Replacing it puts a new onboarding route on top in one change, which fades in like the
    // other flips. The screens left under it are never reached: the step has no Back (iOS) and
    // holds Android's, and saving it resets the Stack to the tabs.
    if (!onAccountCurrencyStep) router.replace(ACCOUNT_CURRENCY_STEP);
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

  function onRouteShown(routeName: string) {
    if (isRouteOpen(routeName, guards)) hideSplash();
  }

  return {
    isReady,
    canUseApp: guards.app,
    canUseOnboarding: guards.onboarding,
    canUseSignIn: guards.signIn,
    fadesSignInOut: !!handover && handoverOverApp && access.app,
    isSettled: !handover && !ONBOARDING_ROUTES.has(root) && !SIGN_IN_ROUTES.has(root),
    signedOutHref,
    isLaunched,
    onRouteShown,
  };
}
