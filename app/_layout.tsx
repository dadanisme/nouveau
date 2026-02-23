import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthHydrator, useAuth } from '@/store';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

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
    <AuthHydrator>
      <AuthGuard>
        <Stack>
          <Stack.Screen
            name="login"
            options={{ headerShown: false, animation: 'flip', animationDuration: 300 }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, animation: 'flip', animationDuration: 300 }}
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
    </AuthHydrator>
  );
}
