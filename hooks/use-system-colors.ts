import { PlatformColor, type ColorValue } from 'react-native';

export type SystemColors = {
  /** Screen background behind grouped content. */
  groupedBackground: ColorValue;
  /** A cell or card on the grouped background. */
  cellBackground: ColorValue;
  /** Primary text. */
  label: ColorValue;
  /** Secondary text, e.g. captions and axis labels. */
  secondaryLabel: ColorValue;
  /** A thin fill for small shapes, e.g. an empty bar. */
  fill: ColorValue;
};

const IOS_COLORS: SystemColors = {
  groupedBackground: PlatformColor('systemGroupedBackground'),
  cellBackground: PlatformColor('secondarySystemGroupedBackground'),
  label: PlatformColor('label'),
  secondaryLabel: PlatformColor('secondaryLabel'),
  fill: PlatformColor('systemFill'),
};

/**
 * Semantic colors for plain React Native views that can't be native (e.g. the proof viewer's PDF /
 * WebView renderers, the legacy trend chart). iOS: UIKit grouped backgrounds, labels and fills.
 */
export function useSystemColors(): SystemColors {
  return IOS_COLORS;
}
