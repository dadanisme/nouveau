import { Text, TextButton, type MaterialColors } from '@expo/ui/jetpack-compose';
import { Stack } from 'expo-router';

import { ComposeHost } from '@/components/compose-host';
import type { OnboardingSkipToolbarProps } from '@/components/onboarding-skip-toolbar';
import { ACCENT_COLOR } from '@/constants/accent';

// The accent as the `primary` role, which tints an M3 text button's label.
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

/**
 * The value pages' Skip (Android): an M3 text button at the end of the top app bar.
 * `Stack.Toolbar.Button` draws only icon buttons on Android, so the header gets its own host.
 */
export function OnboardingSkipToolbar({ title, onPress }: OnboardingSkipToolbarProps) {
  return (
    <Stack.Screen
      options={{
        headerRight: () => (
          <ComposeHost matchContents colorOverrides={COLOR_OVERRIDES}>
            <TextButton onClick={onPress}>
              <Text>{title}</Text>
            </TextButton>
          </ComposeHost>
        ),
      }}
    />
  );
}
