import type { NativeStackNavigationOptions } from 'expo-router';

type SheetDetents = NonNullable<NativeStackNavigationOptions['sheetAllowedDetents']>;

/**
 * Root Stack options for a sheet route (`app/(sheets)/*`): a native form sheet with a grabber and
 * no header. Android form sheets support at most 3 detents and no header, so keep both true here.
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
  };
}
