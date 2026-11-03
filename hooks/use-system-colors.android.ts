import { useMaterialColors } from '@expo/ui/jetpack-compose';

import type { SystemColors } from '@/hooks/use-system-colors';

/**
 * Semantic background colors for plain React Native views on screens that can't be a native
 * form. Android: the Material 3 `surface` / `surfaceContainer` roles of the system (dynamic)
 * palette, matching the Compose screens.
 */
export function useSystemColors(): SystemColors {
  const colors = useMaterialColors();
  return {
    groupedBackground: colors.surface,
    cellBackground: colors.surfaceContainer,
  };
}
