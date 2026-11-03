import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthListener } from '@/components/auth-listener';
import { SplashOverlay } from '@/components/splash-overlay';
import { ACCENT_HEX } from '@/constants/accent';
import { formHeaderBackground } from '@/constants/form-header';
import { sheetOptions } from '@/constants/sheet-options';
import { LanguageProvider, useLanguage } from '@/contexts/language';
import { WorkspaceProvider } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
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
          options={({ route, navigation }) => ({
            title: (route.params as { id?: string } | undefined)?.id
              ? t(k.addTransaction.editTransaction)
              : t(k.addTransaction.addTransaction),
            // A sheet with a form gets an explicit Cancel (HIG), not just swipe-to-dismiss.
            // Android's full-screen modal keeps its back arrow.
            unstable_headerLeftItems: () => [
              {
                type: 'button',
                label: t(k.common.cancel),
                onPress: () => navigation.goBack(),
              },
            ],
            // Android form sheets have no native header, which would drop the title and the
            // edit menu, so Android gets a full-screen modal (M3 full-screen dialog) instead.
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            // One large detent: the amount field opens the keyboard, which needs the full
            // height to keep the form visible; swipe down (or the grabber) dismisses.
            sheetAllowedDetents: [1.0],
            sheetGrabberVisible: true,
          })}
        />
        <Stack.Screen
          name="proof-viewer"
          options={({ navigation }) => ({
            title: t(k.proofs.title),
            // Opened from rows and from the add-transaction sheet, so it's always a modal
            // (iOS page sheet, Android full-screen) rather than a push that lands over the
            // sheet. iOS gets an explicit Done (HIG); Android keeps its back arrow.
            presentation: 'modal',
            unstable_headerLeftItems: () => [
              {
                type: 'button',
                label: t(k.common.done),
                onPress: () => navigation.goBack(),
              },
            ],
          })}
        />
        {/* Sheet routes (app/(sheets)/*): results come back through lib/sheet-result.ts. */}
        <Stack.Screen
          name="(sheets)/category-picker"
          options={sheetOptions([0.5, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/category-transactions"
          options={sheetOptions([0.6, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/workspace-switcher"
          options={sheetOptions([0.5, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/workspace-invite"
          options={sheetOptions([0.5, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/category-form"
          options={sheetOptions([0.85, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/icon-picker"
          options={sheetOptions([0.75, 1], { nativeBody: true })}
        />
        <Stack.Screen
          name="(sheets)/color-picker"
          options={sheetOptions([0.8, 1], { nativeBody: true })}
        />
      </Stack>
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
