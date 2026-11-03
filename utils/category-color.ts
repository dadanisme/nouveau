import { Platform, PlatformColor, type ColorValue } from 'react-native';

import { k } from '@/locales/keys';

export type CategorySystemColorId =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export interface CategorySystemColor {
  id: CategorySystemColorId;
  /** UIKit dynamic system color, adapts to light/dark and Increase Contrast. */
  ios: string;
  /**
   * The hex the app writes to `categories.color` for this color. Always one of the legacy palette
   * hexes, so the web app (which renders the stored hex) keeps showing it unchanged.
   */
  hex: string;
  /** Display name, a `k.categories.colors.*` key. */
  labelKey: string;
}

/** The colors the native color picker offers, in picker order. */
export const CATEGORY_SYSTEM_COLORS: readonly CategorySystemColor[] = [
  { id: 'red', ios: 'systemRed', hex: '#EF4444', labelKey: k.categories.colors.red },
  { id: 'orange', ios: 'systemOrange', hex: '#F97316', labelKey: k.categories.colors.orange },
  { id: 'yellow', ios: 'systemYellow', hex: '#EAB308', labelKey: k.categories.colors.yellow },
  { id: 'green', ios: 'systemGreen', hex: '#22C55E', labelKey: k.categories.colors.green },
  { id: 'teal', ios: 'systemTeal', hex: '#14B8A6', labelKey: k.categories.colors.teal },
  { id: 'blue', ios: 'systemBlue', hex: '#3B82F6', labelKey: k.categories.colors.blue },
  { id: 'purple', ios: 'systemPurple', hex: '#8B5CF6', labelKey: k.categories.colors.purple },
  { id: 'pink', ios: 'systemPink', hex: '#EC4899', labelKey: k.categories.colors.pink },
  { id: 'gray', ios: 'systemGray', hex: '#64748B', labelKey: k.categories.colors.gray },
];

/** Color for a new category (red, the first color the legacy picker preselected). */
export const DEFAULT_CATEGORY_COLOR = CATEGORY_SYSTEM_COLORS[0].hex;

/**
 * Hue ranges (degrees, upper bound exclusive) for mapping a stored hex to the nearest system color.
 * The bounds are set so every hex the legacy mobile/web palette could store
 * (`web/src/lib/category-colors.ts`) lands on the color it was designed as: Tailwind amber on
 * orange, lime and emerald on green, cyan on teal, sky and indigo on blue, fuchsia on purple, rose
 * on pink (iOS systemPink is a rose-pink). Seeded pastels (`#FF6B6B`, `#4ECDC4` …) follow the same
 * ranges.
 */
const HUE_RANGES: readonly [maxHue: number, id: CategorySystemColorId][] = [
  [15, 'red'],
  [40, 'orange'],
  [75, 'yellow'],
  [165, 'green'],
  [196, 'teal'],
  [250, 'blue'],
  [315, 'purple'],
  [355, 'pink'],
  [360, 'red'],
];

/** Below this chroma (max − min channel, 0–1) a hex reads as a neutral (slate, stone, near-white). */
const NEUTRAL_CHROMA = 0.2;

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The nearest system color id for a valid hex, by hue (neutrals map to gray). Alpha is ignored. */
function nearestSystemColorId(hex: string): CategorySystemColorId {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const chroma = max - Math.min(r, g, b);
  if (chroma < NEUTRAL_CHROMA) return 'gray';

  const sector =
    max === r
      ? ((g - b) / chroma + 6) % 6
      : max === g
        ? (b - r) / chroma + 2
        : (r - g) / chroma + 4;
  const hue = sector * 60;
  return HUE_RANGES.find(([maxHue]) => hue < maxHue)?.[1] ?? 'red';
}

const SYSTEM_COLORS_BY_ID = Object.fromEntries(
  CATEGORY_SYSTEM_COLORS.map((color) => [color.id, color]),
) as Record<CategorySystemColorId, CategorySystemColor>;

const FALLBACK_SYSTEM_COLOR = SYSTEM_COLORS_BY_ID.gray;

/**
 * The system color a stored `categories.color` hex is shown as: the nearest of the 9 by hue, or
 * null for a missing or malformed value. Display only: the stored hex is never rewritten (the web
 * app renders it as stored), so only an explicit pick in the color picker writes a new value.
 */
export function getCategorySystemColor(hex: string | null | undefined): CategorySystemColor | null {
  if (!hex || !HEX_PATTERN.test(hex)) return null;
  return SYSTEM_COLORS_BY_ID[nearestSystemColorId(hex)];
}

/** The system color for an id, e.g. a native picker's selection. */
export function getSystemColorById(id: CategorySystemColorId): CategorySystemColor {
  return SYSTEM_COLORS_BY_ID[id];
}

/**
 * Renders a system color: the UIKit dynamic color on iOS; on Android its canonical hex.
 *
 * Android has no hue-stable dynamic colors (Material You roles follow the wallpaper, and the
 * `@android:color/holo_*` set is legacy), so Android keeps one fixed mid-tone per color. These are
 * Tailwind 500 tones: they clear 3:1 on both M3 light and dark surfaces for icons (yellow on light
 * excepted, as on iOS) and match what the web app shows for the same row.
 */
export function systemColorValue(color: CategorySystemColor): ColorValue {
  return Platform.OS === 'ios' ? PlatformColor(color.ios) : color.hex;
}

/**
 * Display color for a stored `categories.color` hex: its nearest system color, and gray for a
 * missing or malformed one. Works as an RN color and as an `@expo/ui` color: SwiftUI takes the iOS
 * `PlatformColor`, Compose the Android hex.
 */
export function getCategoryColor(hex: string | null | undefined): ColorValue {
  return systemColorValue(getCategorySystemColor(hex) ?? FALLBACK_SYSTEM_COLOR);
}
