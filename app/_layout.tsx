import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useGlobalSearchParams,
  useRouter,
  useSegments,
} from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertDialogHost } from '@/components/alert-dialog-host';
import { AuthListener } from '@/components/auth-listener';
import { ACCENT_HEX } from '@/constants/accent';
import { formHeaderBackground } from '@/constants/form-header';
import { sheetOptions } from '@/constants/sheet-options';
import { LanguageProvider, useLanguage } from '@/contexts/language';
import { PeriodProvider } from '@/contexts/period';
import { WorkspaceProvider } from '@/contexts/workspace';
import { useGuestSession, useSession } from '@/hooks/use-auth';
import { useCurrencyStepNeeded } from '@/hooks/use-currency-step-needed';
import { goBackOrHome, resetTo } from '@/lib/navigation';
import { markOnboardingSeen, readOnboardingSeen } from '@/lib/onboarding';
import { k } from '@/locales/keys';

// The system launch screen (expo-splash-screen, app.json) stays up until AuthGuard has routed, so
// the first screen people see is the right one. No branded overlay or zoom (HIG launching).
SplashScreen.preventAutoHideAsync();

// The tab shell sits under every route opened cold from a deep link (`nouveau://add-transaction`,
// the proof viewer, a share intent), so iOS presents sheets and modals over it and Android's Back
// returns to it.
export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

// React Navigation themes with the brand accent as the tint (header buttons, back
// chevron). Every other color stays the system default for the appearance.
const LIGHT_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: ACCENT_HEX } };
const DARK_THEME = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: ACCENT_HEX } };

function ShareIntentNavigator() {
  const { hasShareIntent } = useShareIntentContext();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (hasShareIntent && segments[0] !== 'shareintent') {
      router.replace('/shareintent');
    }
  }, [hasShareIntent, segments, router]);

  return null;
}

/**
 * Routes between the signed-out entry screens and the app (#78):
 * - Signed out: the value pages on a fresh install, Welcome once they've been seen (or after any
 *   sign-in, so signing out lands on Welcome). Login, Signup, onboarding and a share intent stay.
 * - Signed in or a guest: entry screens reset to the tabs, except a brand-new account's currency
 *   step (`/onboarding/currency?for=account`), which it's sent to once, from anywhere.
 * The system splash stays up until the first routing pass, so no wrong screen flashes.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  // A guest (#100) uses the app like a signed-in user, with on-device data.
  const { guestId } = useGuestSession();
  const isSignedIn = !!session || !!guestId;
  const currencyStep = useCurrencyStepNeeded();
  const segments = useSegments();
  const params = useGlobalSearchParams<{ for?: string }>();
  // The account the currency step was shown to, so it's offered once per sign-in.
  const currencyStepShownTo = useRef<string | null>(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const [root, child] = segments as string[];
    const inEntry = root === 'login' || root === 'signup' || root === 'onboarding';
    const inShareIntent = root === 'shareintent';
    const onAccountCurrencyStep =
      root === 'onboarding' && child === 'currency' && params.for === 'account';
    const userId = session?.user.id ?? null;

    if (!isSignedIn) {
      currencyStepShownTo.current = null;
      if (!inEntry && !inShareIntent) {
        resetTo(readOnboardingSeen() ? '/onboarding/welcome' : '/onboarding');
      }
    } else {
      // Someone who has used the app returns to Welcome after signing out, not the value pages.
      markOnboardingSeen();
      if (currencyStep.isNeeded && userId && currencyStepShownTo.current !== userId) {
        currencyStepShownTo.current = userId;
        if (!onAccountCurrencyStep) resetTo('/onboarding/currency?for=account');
      } else if (inEntry && !currencyStep.isChecking) {
        const staysOnCurrencyStep = onAccountCurrencyStep && currencyStep.isNeeded;
        if (!staysOnCurrencyStep) resetTo('/');
      }
    }

    const timeout = setTimeout(() => setIsNavigationReady(true), 50);
    return () => clearTimeout(timeout);
  }, [
    isSignedIn,
    isLoading,
    segments,
    params.for,
    session?.user.id,
    currencyStep.isNeeded,
    currencyStep.isChecking,
  ]);

  useEffect(() => {
    if (!isLoading && isNavigationReady) SplashScreen.hideAsync();
  }, [isLoading, isNavigationReady]);

  return children;
}

function RootStack() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME}>
      {/* iOS leaves the status bar to UIKit (view-controller-based appearance, app.json), so it
          turns light over a full-height sheet's black backdrop. Android sets it per appearance. */}
      {Platform.OS === 'android' && <StatusBar style="auto" />}
      <Stack
        screenOptions={{
          // The screen below these is the tab shell, which has no title of its own, so
          // show only the chevron and give it a real label for VoiceOver.
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: t(k.common.back),
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'flip',
            animationDuration: 300,
            gestureEnabled: false,
          }}
        />
        {/* The first-run flow (#78): value pages, Welcome, the currency step. Its own Stack
            draws the bars; swipe-back would leave the flow for whatever is under it. */}
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="login"
          // A native push from Welcome: the system back button and swipe-back return there. iOS:
          // a native bar with only Back, as on Signup, so scrolled content doesn't run under the
          // status bar (it blurs behind the bar on iOS 26+). Android pads the form itself.
          options={{
            headerShown: Platform.OS === 'ios',
            title: '',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
            },
          }}
        />
        <Stack.Screen
          name="signup"
          // A native push from Login: the system back button and swipe-back. No title, since
          // the form's own headline names the screen; the bar takes the form's background.
          options={{
            title: '',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
            },
          }}
        />
        <Stack.Screen
          name="shareintent"
          options={{
            title: t(k.shareIntent.title),
            // The screen's own Cancel / close (Stack.Toolbar) dismisses: it resets the share
            // intent and returns home, which a back gesture would skip.
            headerBackVisible: false,
            gestureEnabled: false,
            animation: 'fade',
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="add-transaction"
          // A nested Stack (app/add-transaction/_layout.tsx) draws the header: the title, Cancel
          // and Save, and the pickers it pushes. Android form sheets have no header, which would
          // drop all of that, so Android gets a full-screen modal (M3 full-screen dialog) instead.
          options={{
            headerShown: false,
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            // One large detent: the amount field opens the keyboard, which needs the full
            // height to keep the form visible; swipe down (or the grabber) dismisses.
            sheetAllowedDetents: [1.0],
            sheetGrabberVisible: true,
          }}
        />
        <Stack.Screen
          name="proof-viewer"
          options={{
            title: t(k.proofs.title),
            // Opened from rows, so it's always a modal (iOS page sheet, Android full-screen).
            // A read-only viewer: iOS gets the leading Close (xmark, HIG); Android keeps its
            // back arrow. Inside Edit Transaction it's pushed instead (add-transaction/proofs).
            presentation: 'modal',
            unstable_headerLeftItems: () => [
              {
                type: 'button',
                label: t(k.common.close),
                icon: { type: 'sfSymbol', name: 'xmark' },
                accessibilityLabel: t(k.common.close),
                // A cold deep link has nothing behind it, so this falls back to the tabs.
                onPress: goBackOrHome,
              },
            ],
          }}
        />
        {/* Sheet routes (app/(sheets)/*): results come back through lib/sheet-result.ts. iOS
            sheets get the native header (title, Cancel/Close, Save); Android's are headerless. */}
        <Stack.Screen
          name="(sheets)/category-transactions"
          options={sheetOptions([0.6, 1], { header: true })}
        />
        <Stack.Screen
          name="(sheets)/workspace-switcher"
          options={{
            ...sheetOptions([0.5, 1], { header: true }),
            title: t(k.workspace.switch),
          }}
        />
        {/* One detent: the email field autofocuses, and the keyboard always takes it to full
            height anyway (HIG sheets: no medium detent when the content needs full height). */}
        <Stack.Screen
          name="(sheets)/workspace-invite"
          options={sheetOptions([1], { header: true })}
        />
        {/* A nested Stack: the icon and color pickers push inside it on iOS. One large detent
            on iOS: the name field autofocuses and the pickers need the full height, and with a
            medium detent the sheet dropped back to it whenever the keyboard closed (opening a
            picker, returning from one). */}
        <Stack.Screen
          name="(sheets)/category-form"
          options={sheetOptions(Platform.OS === 'ios' ? [1] : [0.85, 1])}
        />
        {/* Pickers presented as their own sheet on Android only; iOS pushes them inside the
            editor's Stack (add-transaction/category-picker, category-form/*-picker). */}
        <Stack.Screen name="(sheets)/category-picker" options={sheetOptions([0.5, 1])} />
        <Stack.Screen name="(sheets)/icon-picker" options={sheetOptions([0.75, 1])} />
        <Stack.Screen name="(sheets)/color-picker" options={sheetOptions([0.8, 1])} />
      </Stack>
      {/* Android: presents `showAlertDialog` / `confirmDestructive` as Material 3 dialogs. */}
      <AlertDialogHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={styles.root}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <ShareIntentProvider
            options={{
              debug: __DEV__,
              resetOnBackground: true,
              onResetShareIntent: () => router.dismissTo('/'),
            }}
          >
            <ShareIntentNavigator />
            <AuthListener>
              <WorkspaceProvider>
                <PeriodProvider>
                  <AuthGuard>
                    <RootStack />
                  </AuthGuard>
                </PeriodProvider>
              </WorkspaceProvider>
            </AuthListener>
          </ShareIntentProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
