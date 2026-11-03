import { SymbolView } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { getCategoryColor } from '@/utils/category-color';
import { getCategorySymbol } from '@/utils/category-icon';

interface CategoryIconProps {
  /** Stored `categories.icon` (`"Ionicons/<name>"` or null). */
  icon: string | null | undefined;
  /** Stored `categories.color` hex. */
  color: string | null | undefined;
  /** Glyph size in points/dp. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A category's glyph in its color, for React Native trees (rows, pickers, charts legends): an SF
 * Symbol on iOS, a Material Symbol (from the Material Symbols font, no per-icon asset) on Android.
 * Decorative: the category name next to it carries the meaning for screen readers.
 *
 * Inside `@expo/ui` trees use the same helpers instead: SwiftUI `<Image systemName={sf}
 * color={getCategoryColor(hex)} />`, Compose `<Icon source={useMaterialSymbolSources(...)} />`.
 */
export function CategoryIcon({ icon, color, size = 24, style }: CategoryIconProps) {
  const symbol = getCategorySymbol(icon);

  return (
    <SymbolView
      name={{ ios: symbol.sf, android: symbol.material }}
      tintColor={getCategoryColor(color)}
      size={size}
      style={style}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}
