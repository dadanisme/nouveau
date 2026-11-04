import { useMaterialColors } from '@expo/ui/jetpack-compose';

import type { SystemColors } from '@/hooks/use-system-colors';

/**
 * Semantic colors for plain React Native views that can't be native. Android: the Material 3
 * roles of the system (dynamic) palette, matching the Compose screens.
 */
export function useSystemColors(): SystemColors {
  const colors = useMaterialColors();
  return {
    groupedBackground: colors.surface,
    cellBackground: colors.surfaceContainer,
    label: colors.onSurface,
    secondaryLabel: colors.onSurfaceVariant,
    fill: colors.surfaceContainerHighest,
  };
}
