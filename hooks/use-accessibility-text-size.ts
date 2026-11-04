import { useWindowDimensions } from 'react-native';

// React Native's iOS font scale is 1.353 at the largest standard size (xxxLarge) and 1.786 at the
// first accessibility size (AX1, `accessibilityMedium`), up to 3.571 at AX5.
const ACCESSIBILITY_FONT_SCALE = 1.7;

/**
 * True at the accessibility Dynamic Type sizes (AX1–AX5), where rows switch from title and value
 * side by side to a stacked layout, per the HIG ("consider using a stacked layout where text
 * appears above secondary items"). Updates live when the text size changes.
 */
export function useIsAccessibilityTextSize(): boolean {
  return useWindowDimensions().fontScale >= ACCESSIBILITY_FONT_SCALE;
}

/**
 * A size in points that grows with the Dynamic Type font scale, capped at `maxScale` times the
 * base, for things that can't take a text style (bitmap logos, avatars, fixed-height controls).
 */
export function useScaledSize(base: number, maxScale = 2): number {
  const { fontScale } = useWindowDimensions();
  return Math.round(base * Math.min(Math.max(fontScale, 1), maxScale));
}
