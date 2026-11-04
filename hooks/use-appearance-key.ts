import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

// Remounting in the same pass as the trait change is too early: the new view still loses its tint.
const REMOUNT_DELAY_MS = 150;

function toKey(colorScheme: string | null | undefined, isHighContrast: boolean): string {
  return `${colorScheme ?? 'light'}-${isHighContrast ? 'high' : 'normal'}`;
}

/**
 * A key that changes shortly after the appearance (light / dark) or Increase Contrast changes.
 * Keying a SwiftUI `Host` on it remounts it, for views that lose their tint on a live trait
 * change: on iOS 18, an inline `Picker`'s checkmark turns system blue (with a plain hex tint too)
 * until the view is rebuilt.
 */
export function useAppearanceKey(): string {
  const colorScheme = useColorScheme();
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [key, setKey] = useState(() => toKey(colorScheme, false));

  useEffect(() => {
    AccessibilityInfo.isDarkerSystemColorsEnabled().then(setIsHighContrast);
    const subscription = AccessibilityInfo.addEventListener(
      'darkerSystemColorsChanged',
      setIsHighContrast,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setKey(toKey(colorScheme, isHighContrast)), REMOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [colorScheme, isHighContrast]);

  return key;
}
