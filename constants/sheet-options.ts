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
 */
export function sheetOptions(detents: SheetDetents): NativeStackNavigationOptions {
  if (__DEV__ && Array.isArray(detents) && detents.length > 3) {
    console.warn('sheetOptions: Android form sheets support at most 3 detents.');
  }
  return {
    presentation: 'formSheet',
    headerShown: false,
    sheetGrabberVisible: true,
    sheetAllowedDetents: detents,
    ...(Platform.OS === 'android' && { sheetCornerRadius: ANDROID_SHEET_CORNER_RADIUS }),
    // Sheet bodies still draw legacy dark text, so pin the sheet to the same legacy cream as the
    // screen bodies in both appearances. #28–#36 replace this with system backgrounds.
    contentStyle: { backgroundColor: colors.background },
  };
}
