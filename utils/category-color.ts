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
 * Every hex the legacy mobile/web palette could store (`web/src/lib/category-colors.ts`), mapped to
 * the nearest system color by hue. Keys are uppercase.
 */
const PALETTE_HEX_TO_SYSTEM: Record<string, CategorySystemColorId> = {
  // Reds
  '#EF4444': 'red',
  '#DC2626': 'red',
  // Oranges (Tailwind amber #F59E0B sits on iOS systemOrange's hue)
  '#F97316': 'orange',
  '#EA580C': 'orange',
  '#F59E0B': 'orange',
  // Yellows
  '#EAB308': 'yellow',
  '#FACC15': 'yellow',
  '#CA8A04': 'yellow',
  // Greens (incl. emerald and lime)
  '#22C55E': 'green',
  '#16A34A': 'green',
  '#10B981': 'green',
  '#059669': 'green',
  '#84CC16': 'green',
  // Teals and cyans
  '#14B8A6': 'teal',
  '#06B6D4': 'teal',
  '#0891B2': 'teal',
  // Blues (incl. sky and indigo)
  '#0EA5E9': 'blue',
  '#3B82F6': 'blue',
  '#2563EB': 'blue',
  '#6366F1': 'blue',
  // Purples (incl. fuchsia)
  '#8B5CF6': 'purple',
  '#7C3AED': 'purple',
  '#A855F7': 'purple',
  '#D946EF': 'purple',
  '#C026D3': 'purple',
  // Pinks (incl. rose; iOS systemPink is a rose-pink)
  '#EC4899': 'pink',
  '#DB2777': 'pink',
  '#F43F5E': 'pink',
  '#E11D48': 'pink',
  // Neutrals (slate and stone)
  '#78716C': 'gray',
  '#64748B': 'gray',
  '#475569': 'gray',
  '#1F2937': 'gray',
  '#44403C': 'gray',
};

const SYSTEM_COLORS_BY_ID = Object.fromEntries(
  CATEGORY_SYSTEM_COLORS.map((color) => [color.id, color]),
) as Record<CategorySystemColorId, CategorySystemColor>;

const FALLBACK_SYSTEM_COLOR = SYSTEM_COLORS_BY_ID.gray;

/** The system color a stored `categories.color` hex maps to, or null for a custom hex. */
export function getCategorySystemColor(hex: string | null | undefined): CategorySystemColor | null {
  if (!hex) return null;
  const id = PALETTE_HEX_TO_SYSTEM[hex.toUpperCase()];
  return id ? SYSTEM_COLORS_BY_ID[id] : null;
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
 * Display color for a stored `categories.color` hex: palette hexes render as their system color,
 * any other valid hex as stored, and a missing or malformed one as gray. Works as an RN color
 * and as an `@expo/ui` color: SwiftUI takes the iOS `PlatformColor`, Compose the Android hex.
 */
export function getCategoryColor(hex: string | null | undefined): ColorValue {
  const system = getCategorySystemColor(hex);
  if (system) return systemColorValue(system);
  if (hex && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return hex;
  return systemColorValue(FALLBACK_SYSTEM_COLOR);
}
