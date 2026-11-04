import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertDialogHost } from '@/components/alert-dialog-host';
import { AuthListener } from '@/components/auth-listener';
import { SplashOverlay } from '@/components/splash-overlay';
import { ACCENT_HEX } from '@/constants/accent';
import { formHeaderBackground } from '@/constants/form-header';
import { sheetOptions } from '@/constants/sheet-options';
import { LanguageProvider, useLanguage } from '@/contexts/language';
import { WorkspaceProvider } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import { goBackOrHome } from '@/lib/navigation';
import { k } from '@/locales/keys';

SplashScreen.preventAutoHideAsync();

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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inShareIntent = segments[0] === 'shareintent';

    if (!session && !inAuthGroup && !inShareIntent) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }

    const timeout = setTimeout(() => setIsNavigationReady(true), 50);
    return () => clearTimeout(timeout);
  }, [session, isLoading, segments, router]);

  return (
    <>
      {children}
      <SplashOverlay isReady={!isLoading && isNavigationReady} />
    </>
  );
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
        <Stack.Screen
          name="login"
          // iOS: an empty native bar, as on Signup, so scrolled content doesn't run under the
          // status bar (it blurs behind the bar on iOS 26+). Android pads the form itself.
          options={{
            headerShown: Platform.OS === 'ios',
            title: '',
            // The signed-out root: AuthGuard replaces into it, so there is nothing to go back to.
            headerBackVisible: false,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
            },
            animation: 'flip',
            animationDuration: 300,
            gestureEnabled: false,
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
              onResetShareIntent: () => router.replace('/'),
            }}
          >
            <ShareIntentNavigator />
            <AuthListener>
              <WorkspaceProvider>
                <AuthGuard>
                  <RootStack />
                </AuthGuard>
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
