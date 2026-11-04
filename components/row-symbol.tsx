import { Image } from '@expo/ui/swift-ui';
import { font, frame } from '@expo/ui/swift-ui/modifiers';

import type { FormSymbol } from '@/components/native-form-types';

// The leading glyph box at the default text size, so titles line up and rows keep one height
// whatever the symbol's shape. It's a minimum: the box grows with the glyph at larger sizes.
const SYMBOL_BOX = 28;

/**
 * A row's leading SF Symbol (iOS) in its color. Sized by a text style, so it grows with Dynamic
 * Type like the text beside it ("Increase the size of meaningful interface icons as font size
 * increases", HIG typography).
 */
export function RowSymbol({ symbol }: { symbol: FormSymbol }) {
  return (
    <Image
      systemName={symbol.sf}
      color={symbol.color}
      modifiers={[
        font({ textStyle: 'title2' }),
        frame({ minWidth: SYMBOL_BOX, minHeight: SYMBOL_BOX }),
      ]}
    />
  );
}
