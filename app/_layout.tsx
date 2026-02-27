import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthListener } from '@/components/auth-listener';
import { SplashOverlay } from '@/components/splash-overlay';
import { useSession } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
      router.replace('/(tabs)');
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

export default function RootLayout() {
  const router = useRouter();

  return (
    <GestureHandlerRootView style={styles.root}>
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
              <AuthGuard>
                <Stack>
                  <Stack.Screen
                    name="login"
                    options={{ headerShown: false, animation: 'flip', animationDuration: 300 }}
                  />
                  <Stack.Screen
                    name="signup"
                    options={{ headerShown: false, animationDuration: 300 }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, animation: 'flip', animationDuration: 300 }}
                  />
                  <Stack.Screen
                    name="add-transaction"
                    options={{
                      headerShown: false,
                      animationDuration: 350,
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      headerShown: false,
                      animationDuration: 350,
                    }}
                  />
                  <Stack.Screen
                    name="categories"
                    options={{
                      headerShown: false,
                      animationDuration: 350,
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
                </Stack>
              </AuthGuard>
            </AuthListener>
          </BottomSheetModalProvider>
        </ShareIntentProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
