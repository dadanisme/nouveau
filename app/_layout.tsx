import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, PlatformColor, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertDialogHost } from '@/components/alert-dialog-host';
import { AuthListener } from '@/components/auth-listener';
import { ACCENT_HEX } from '@/constants/accent';
import { formHeaderBackground } from '@/constants/form-header';
import { sheetOptions } from '@/constants/sheet-options';
import { LanguageProvider, useLanguage } from '@/contexts/language';
import { PeriodProvider } from '@/contexts/period';
import { WorkspaceProvider } from '@/contexts/workspace';
import { type AuthRoutes, useAuthRoutes } from '@/hooks/use-auth-routes';
import { useGuestUpload, useGuestUploadNotice } from '@/hooks/use-guest-upload';
import { goBackOrHome } from '@/lib/navigation';
import { k } from '@/locales/keys';

// The system launch screen (expo-splash-screen, app.json) stays up until the first screen the
// guards allow has appeared (useAuthRoutes), so the first screen people see is the right one. No
// branded overlay or zoom (HIG launching).
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
 * Mounts the root Stack once the guards are known (useAuthRoutes), so the first screen rendered is
 * the one the guards allow. Until then nothing renders and the native splash stays up. Also runs a
 * signed-in guest's upload (#100), which Login waits for, and its notice once the tabs are back.
 */
function RootNavigator() {
  const upload = useGuestUpload();
  const routes = useAuthRoutes({ isUploading: upload.isUploading });
  useGuestUploadNotice(upload, routes.isReady && routes.isSettled);
  if (!routes.isReady) return null;

  return (
    <>
      <ShareIntentNavigator />
      <RootStack routes={routes} />
    </>
  );
}

function RootStack({ routes }: { routes: AuthRoutes }) {
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
        // The first allowed screen to finish appearing takes the splash down (useAuthRoutes).
        // `focus` comes too early: the route is in the state, but its screen isn't drawn yet.
        screenListeners={({ route }) => ({
          transitionEnd: (event) => {
            if (!event.data.closing) routes.onRouteShown(route.name);
          },
        })}
      >
        {/* Signed in or a guest (useAuthRoutes): the tab shell and everything opened from it.
            Signed out, the focused one redirects to onboarding (on a cold launch, the tabs).
            Moving between these and the entry routes mid-session (sign in or out, Get Started)
            fades: it's a change of context, not a step deeper. A cold launch shows the first
            screen with no animation, straight from the splash. */}
        <Stack.Protected guard={routes.canUseApp} redirectTo={routes.signedOutHref}>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animation: routes.isLaunched ? 'fade' : 'none',
              animationDuration: 300,
              gestureEnabled: false,
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
        </Stack.Protected>
        {/* Signed out (and a new account's currency step): the first-run flow. Once signed in or
            a guest, it redirects to the tabs. */}
        <Stack.Protected guard={routes.canUseOnboarding} redirectTo="/">
          {/* The first-run flow (#78): value pages, Welcome, the currency step. Its own Stack
              draws the bars; swipe-back would leave the flow for whatever is under it. */}
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: routes.isLaunched ? 'fade' : 'none',
              animationDuration: 300,
            }}
          />
        </Stack.Protected>
        {/* Without a session (signed out, or a guest from Settings' Sign In), and while a sign-in
            settles (a guest's upload, a new account's currency step). Then the focused one
            redirects to the tabs; a guest's Login, pushed over them, fades back to them. */}
        <Stack.Protected guard={routes.canUseSignIn} redirectTo="/">
          <Stack.Screen
            name="login"
            // A native push from Welcome: the system back button (Android's Up arrow) and
            // swipe-back return there. A bar with only Back and no title, as on Signup, so scrolled
            // content doesn't run under the status bar (it blurs behind the bar on iOS 26+).
            options={{
              title: '',
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
              },
              animation: routes.fadesSignInOut ? 'fade' : 'default',
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
              animation: routes.fadesSignInOut ? 'fade' : 'default',
            }}
          />
        </Stack.Protected>
        {/* Open to both. */}
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
          name="introduction"
          // Settings' View Introduction: the value pages in a modal (iOS page sheet, Android
          // full-screen). An empty bar for iOS's leading Close (the screen's toolbar) and
          // Android's Up arrow; the page titles name the content.
          options={{
            title: '',
            presentation: 'modal',
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
            },
            // iOS: the grouped background the pager is drawn on, as in the first-run flow.
            contentStyle:
              Platform.OS === 'ios'
                ? { backgroundColor: PlatformColor('systemGroupedBackground') }
                : undefined,
          }}
        />
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
            <AuthListener>
              <WorkspaceProvider>
                <PeriodProvider>
                  <RootNavigator />
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
