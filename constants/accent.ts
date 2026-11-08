import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

/** The only brand color, as a hex (Android, and the navigation theme). */
export const ACCENT_HEX = '#E24A00';

/**
 * The accent as the app tint (tabs, header buttons, links), never as a fill. The dark appearance
 * keeps the brand hex (#59), so light and dark are both `ACCENT_HEX`.
 *
 * iOS spells out the Increase Contrast tones UIKit already derives for its own bars and tab bar
 * (`#B53B00` light, `#FF681F` dark, measured on iOS 18.5 and 27): SwiftUI tints from a plain hex
 * aren't adjusted (Form button rows stayed `#E24A00`), and a menu Picker's value took the light
 * tone in dark mode.
 */
export const ACCENT_COLOR: ColorValue =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: ACCENT_HEX,
        dark: ACCENT_HEX,
        highContrastLight: '#B53B00',
        highContrastDark: '#FF681F',
      })
    : ACCENT_HEX;

/**
 * The accent as a fill behind white text (prominent buttons). `ACCENT_COLOR`'s dark Increase
 * Contrast tone is lighter, which helps accent text on dark backgrounds but drops white text on it
 * to 2.90:1 (#79 HIG review), so a fill takes the darker `#B53B00` in both appearances when
 * Increase Contrast is on: white on it is 5.85:1 (accessibility#Vision). By default it stays the
 * brand hex, like the tint.
 */
export const ACCENT_FILL_COLOR: ColorValue =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: ACCENT_HEX,
        dark: ACCENT_HEX,
        highContrastLight: '#B53B00',
        highContrastDark: '#B53B00',
      })
    : ACCENT_HEX;
