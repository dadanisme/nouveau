import { Host, type HostProps } from '@expo/ui/jetpack-compose';
import { useColorScheme } from 'react-native';

/**
 * The Compose `Host` for Android screens, with the light / dark scheme passed explicitly.
 *
 * Left to itself, the native host follows `isSystemInDarkTheme()`, which reads the view's own
 * configuration. A host that is detached when the system theme changes (a screen under another
 * one, or in an inactive tab) misses that configuration change and keeps the old palette after
 * it reattaches, while `useMaterialColors()` already has the new one: rows and the FAB stayed
 * light on a dark list until the app restarted. React Native's scheme updates every mounted
 * screen, so passing it keeps both sides in step.
 */
export function ComposeHost(props: HostProps) {
  const scheme = useColorScheme();
  return <Host colorScheme={scheme === 'dark' ? 'dark' : 'light'} {...props} />;
}
