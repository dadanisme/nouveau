import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

const IS_IOS_BEFORE_26 = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) < 26;

/**
 * Stack screen options for a tab root with a large title.
 *
 * Before iOS 26, native-stack gives a large-title header a transparent background, so once the
 * title collapses the content shows straight through the bar. Restore the UIKit default there:
 * the system bar material when collapsed, transparent only while the large title shows.
 * iOS 26+ draws its own Liquid Glass bar and is left alone.
 */
export const LARGE_TITLE_OPTIONS: NativeStackNavigationOptions = {
  headerLargeTitleEnabled: true,
  ...(IS_IOS_BEFORE_26 && {
    headerBlurEffect: 'systemChromeMaterial',
    headerLargeStyle: { backgroundColor: 'transparent' },
  }),
};
