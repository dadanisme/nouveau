import { Platform, PlatformColor, type ColorValue } from 'react-native';

const IOS_VERSION = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;
const ANDROID_API = Platform.OS === 'android' ? Number(Platform.Version) : 0;

/**
 * Header background for a pushed screen whose root is a native form, so the bar reads as part of
 * the page instead of a band in the navigation theme's `card` color:
 * - iOS before 26: the grouped background (as in the Settings app). iOS 26+ draws its own Liquid
 *   Glass bar and is left alone.
 * - Android 14+ (API 34): the dynamic `surface` role the Compose form is drawn on. Older Android
 *   has no system resource for it and keeps the theme color.
 */
export function formHeaderBackground(scheme: 'light' | 'dark'): ColorValue | undefined {
  if (Platform.OS === 'ios' && IOS_VERSION < 26) {
    return PlatformColor('systemGroupedBackground');
  }
  if (Platform.OS === 'android' && ANDROID_API >= 34) {
    return PlatformColor(`@android:color/system_surface_${scheme}`);
  }
  return undefined;
}
