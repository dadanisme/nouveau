import { PlatformColor, type ColorValue } from 'react-native';

export type SystemColors = {
  /** Screen background behind grouped content. */
  groupedBackground: ColorValue;
  /** A cell or card on the grouped background. */
  cellBackground: ColorValue;
};

const IOS_COLORS: SystemColors = {
  groupedBackground: PlatformColor('systemGroupedBackground'),
  cellBackground: PlatformColor('secondarySystemGroupedBackground'),
};

/**
 * Semantic background colors for plain React Native views on screens that can't be a native
 * form (e.g. the proof viewer's PDF / WebView renderers). iOS: UIKit grouped backgrounds.
 */
export function useSystemColors(): SystemColors {
  return IOS_COLORS;
}
