import { Stack } from 'expo-router';
import { Platform, PlatformColor, useColorScheme } from 'react-native';

import { formHeaderBackground } from '@/constants/form-header';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

// iOS: the grouped background, as the launch screen and Login, so the first frame matches the
// splash. Android's Compose screens paint the `surface` role themselves.
const CONTENT_STYLE =
  Platform.OS === 'ios' ? { backgroundColor: PlatformColor('systemGroupedBackground') } : undefined;

/**
 * The first-run flow's own Stack (#78): the value pages, Welcome, then the currency step. The root
 * Stack shows it with no header and no swipe-back; these screens draw their own native bars.
 */
export default function OnboardingLayout() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerBackTitle: t(k.common.back),
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: formHeaderBackground(colorScheme === 'dark' ? 'dark' : 'light'),
        },
        contentStyle: CONTENT_STYLE,
      }}
    >
      {/* An empty bar for Skip. */}
      <Stack.Screen name="index" options={{ title: '' }} />
      {/* Reached by replacing the pages, so there's nothing to go back to. */}
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="currency" options={{ title: t(k.onboarding.currencyTitle) }} />
    </Stack>
  );
}
