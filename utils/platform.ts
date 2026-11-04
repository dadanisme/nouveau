import { Platform } from 'react-native';

/**
 * Where the Add transaction action lives on this device:
 * - `toolbar`: a `+` bar button in the Transactions header, every iOS version. The tab bar holds
 *   navigation only (HIG: tab bars support navigation, not actions), so there is no tab-bar slot.
 * - `fab`: a Material 3 floating action button, Android.
 */
export type AddActionPlacement = 'toolbar' | 'fab';

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
  return Platform.OS === 'android' ? 'fab' : 'toolbar';
}
