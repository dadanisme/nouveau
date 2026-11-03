import { useQueries } from '@tanstack/react-query';
import { unstable_getMaterialSymbolSourceAsync, type AndroidSymbol } from 'expo-symbols';
import { Platform, type ImageSourcePropType } from 'react-native';

// The image is only a mask: Compose `Icon` tints it (its `tint` prop or the surrounding content
// color), so the glyph's own color is irrelevant.
const MASK_COLOR = '#000000';
const DEFAULT_SIZE = 24;

/**
 * Material Symbols rendered to image sources for Compose `Icon` (`@expo/ui/jetpack-compose`), which
 * only takes an image source. Each glyph is drawn once from the Material Symbols font that
 * `expo-symbols` ships, at the device density, and cached for the session, so no per-icon vector
 * asset is needed. Android only; returns an empty map on iOS. A symbol is missing from the map
 * until its image is ready.
 */
export function useMaterialSymbolSources(
  symbols: readonly AndroidSymbol[],
  size = DEFAULT_SIZE,
): ReadonlyMap<AndroidSymbol, ImageSourcePropType> {
  const unique = [...new Set(symbols)];

  return useQueries({
    queries: unique.map((symbol) => ({
      queryKey: ['material-symbol-source', symbol, size],
      queryFn: () => unstable_getMaterialSymbolSourceAsync(symbol, size, MASK_COLOR),
      enabled: Platform.OS === 'android',
      staleTime: Infinity,
      gcTime: Infinity,
    })),
    combine: (results) => {
      const sources = new Map<AndroidSymbol, ImageSourcePropType>();
      results.forEach((result, index) => {
        if (result.data) sources.set(unique[index], result.data);
      });
      return sources;
    },
  });
}
