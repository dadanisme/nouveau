import { Box, Icon } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';

import type { FormSymbol } from '@/components/native-form-types';
import { useMaterialSymbolSources } from '@/hooks/use-material-symbol-sources';

// Material 3 leading icon size.
const ICON_SIZE = 24;

/**
 * A Material Symbol from the font inside a Compose tree, tinted with the symbol's color (or the
 * surrounding content color); a same-size blank until its image is ready. Android only: import it
 * from `*.android.tsx` files.
 */
export function ComposeSymbolIcon({
  symbol,
  iconSize = ICON_SIZE,
}: {
  symbol: FormSymbol;
  iconSize?: number;
}) {
  const sources = useMaterialSymbolSources([symbol.material], iconSize);
  const source = sources.get(symbol.material);
  if (!source) return <Box modifiers={[size(iconSize, iconSize)]} />;
  return <Icon source={source} size={iconSize} tint={symbol.color} />;
}
