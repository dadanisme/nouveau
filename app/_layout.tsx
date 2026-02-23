import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthListener } from '@/components/auth-listener';
import { useSession } from '@/hooks/use-auth';

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
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
              </Stack>
            </AuthGuard>
          </AuthListener>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
