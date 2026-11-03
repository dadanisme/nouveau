import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from '@/constants/colors';

type SheetDetents = NonNullable<NativeStackNavigationOptions['sheetAllowedDetents']>;

/** M3 bottom sheets use 28dp top corners; iOS keeps the system default radius. */
const ANDROID_SHEET_CORNER_RADIUS = 28;

/**
 * Root Stack options for a sheet route (`app/(sheets)/*`): a native form sheet with a grabber and
 * no header. Android form sheets support at most 3 detents and no header, so keep both true here.
 * react-native-screens draws no grabber on Android (the prop is iOS-only), so Android sheets rely
 * on swipe-down and the scrim to dismiss.
 *
 * @param detents Fractions of the screen height (ascending, at most 3) or `'fitToContents'`.
 * @param options.nativeBody The body is a native `@expo/ui` tree that paints its own background.
 */
export function sheetOptions(
  detents: SheetDetents,
  { nativeBody = false }: { nativeBody?: boolean } = {},
): NativeStackNavigationOptions {
  if (__DEV__ && Array.isArray(detents) && detents.length > 3) {
    console.warn('sheetOptions: Android form sheets support at most 3 detents.');
  }
  return {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: detents,
    ...(Platform.OS === 'android' && { sheetCornerRadius: ANDROID_SHEET_CORNER_RADIUS }),
    // Native bodies (`@expo/ui` Host filling the sheet) paint their own system background, so
    // the sheet keeps the navigation theme's light/dark background behind them. Legacy bodies
    // still draw dark text, so they stay pinned to the legacy cream in both appearances until
    // #28–#36 rebuild them.
    ...(!nativeBody && { contentStyle: { backgroundColor: colors.background } }),
  };
}
