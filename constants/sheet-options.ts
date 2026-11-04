import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

type SheetDetents = NonNullable<NativeStackNavigationOptions['sheetAllowedDetents']>;

/** M3 bottom sheets use 28dp top corners; iOS keeps the system default radius. */
const ANDROID_SHEET_CORNER_RADIUS = 28;

/**
 * Whether sheets get a native header: iOS sheets show a top bar (title, Cancel/Close leading,
 * Save/Done trailing); Android form sheets support no header, so their forms keep an in-form
 * heading and commit row.
 */
export const SHEET_HAS_HEADER = Platform.OS === 'ios';

/**
 * Root Stack options for a sheet route (`app/(sheets)/*`): a native form sheet with a grabber.
 * Android form sheets support at most 3 detents and no header. react-native-screens draws no
 * grabber on Android (the prop is iOS-only), so Android sheets rely on swipe-down and the scrim.
 *
 * @param detents Fractions of the screen height (ascending, at most 3) or `'fitToContents'`.
 * @param options.header Show the native header on iOS (see {@link SHEET_HAS_HEADER}). Leave it off
 *   for a sheet whose route is a nested Stack: that Stack draws the header.
 */
export function sheetOptions(
  detents: SheetDetents,
  { header = false }: { header?: boolean } = {},
): NativeStackNavigationOptions {
  if (__DEV__ && Array.isArray(detents) && detents.length > 3) {
    console.warn('sheetOptions: Android form sheets support at most 3 detents.');
  }
  return {
    presentation: 'formSheet',
    headerShown: header && SHEET_HAS_HEADER,
    sheetGrabberVisible: true,
    sheetAllowedDetents: detents,
    ...(Platform.OS === 'android' && { sheetCornerRadius: ANDROID_SHEET_CORNER_RADIUS }),
  };
}
