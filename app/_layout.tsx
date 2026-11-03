import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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
import { ACCENT_COLOR } from '@/constants/accent';
import { LanguageProvider, useLanguage } from '@/contexts/language';
import { WorkspaceProvider } from '@/contexts/workspace';
import { useSession } from '@/hooks/use-auth';
import { k } from '@/locales/keys';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// React Navigation themes with the brand accent as the tint (header buttons, back
// chevron). Every other color stays the system default for the appearance.
const LIGHT_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: ACCENT_COLOR } };
const DARK_THEME = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: ACCENT_COLOR } };

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
      <StatusBar style="auto" />
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
          options={{
            headerShown: false,
            animation: 'flip',
            animationDuration: 300,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
            animationDuration: 300,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="shareintent"
          options={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 300,
          }}
        />
        <Stack.Screen
          name="add-transaction"
          options={({ route }) => ({
            title: (route.params as { id?: string } | undefined)?.id
              ? t(k.addTransaction.editTransaction)
              : t(k.addTransaction.addTransaction),
            // Android form sheets have no native header, which would drop the title and the
            // edit menu, so Android gets a full-screen modal (M3 full-screen dialog) instead.
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            // The form is a full-height number pad layout, so a single large detent keeps
            // every row reachable; swipe down (or the grabber) dismisses.
            sheetAllowedDetents: [1.0],
            sheetGrabberVisible: true,
            // The form doesn't scroll, so keep the header opaque (iOS 26 defaults to
            // transparent) and lay the form out below it.
            headerTransparent: false,
          })}
        />
        <Stack.Screen name="proof-viewer" options={{ title: t(k.proofs.title) }} />
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
            <BottomSheetModalProvider>
              <AuthListener>
                <WorkspaceProvider>
                  <AuthGuard>
                    <RootStack />
                  </AuthGuard>
                </WorkspaceProvider>
              </AuthListener>
            </BottomSheetModalProvider>
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
