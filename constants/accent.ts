import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

/** The only brand color, as a hex (Android, and the navigation theme). */
export const ACCENT_HEX = '#E24A00';

/**
 * The accent as the app tint (tabs, header buttons, links), never as a fill. The dark variant is
 * still TBD (see CLAUDE.md), so light and dark are both the brand hex.
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
