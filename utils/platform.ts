import { Platform } from 'react-native';

/**
 * Where the Add transaction action lives on this device:
 * - `tabBar`: the separate round slot of the native tab bar (a `UISearchTab`), iOS 26.1+.
 * - `toolbar`: a `+` bar button in the Transactions header, older iOS.
 * - `fab`: a Material 3 floating action button, Android.
 */
export type AddActionPlacement = 'tabBar' | 'toolbar' | 'fab';

/** react-native-screens builds the tab bar from `UITab`s, and so `UISearchTab`, from iOS 26.1. */
const TAB_BAR_ACTION_MIN_IOS = { major: 26, minor: 1 };

/** Parses the iOS version (`Platform.Version` is a string like "18.5" there). */
export function parseIOSVersion(version: string | number): { major: number; minor: number } {
  const [major = 0, minor = 0] = String(version).split('.').map(Number);
  return { major, minor };
}

export function isIOSVersionAtLeast(major: number, minor = 0): boolean {
  if (Platform.OS !== 'ios') return false;
  const current = parseIOSVersion(Platform.Version);
  return current.major > major || (current.major === major && current.minor >= minor);
}

export function getAddActionPlacement(): AddActionPlacement {
  if (Platform.OS === 'android') return 'fab';
  return isIOSVersionAtLeast(TAB_BAR_ACTION_MIN_IOS.major, TAB_BAR_ACTION_MIN_IOS.minor)
    ? 'tabBar'
    : 'toolbar';
}
