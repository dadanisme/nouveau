import { Image } from '@expo/ui/swift-ui';
import { font, frame } from '@expo/ui/swift-ui/modifiers';

import type { FormSymbol } from '@/components/native-form-types';
import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';

// The leading symbol column at the default text size: as wide as the widest symbol the app shows
// (`car.side`, 44pt at `title2`), so every title starts at the same x whatever the symbol's shape
// ("Align elements to make them easier to scan", HIG layout#Visual-hierarchy). Narrower symbols
// sit centered in it. Measure again if a wider symbol joins `utils/category-icon.ts`.
const SYMBOL_COLUMN_WIDTH = 44;
// Keeps rows one height whatever the symbol's shape; a minimum, so the glyph can grow past it.
const SYMBOL_MIN_HEIGHT = 28;
// Rows stack from the first accessibility size, so the column only needs to scale through the
// standard sizes (title2 grows less than body's 1.353 at xxxLarge, so this leaves room).
const SYMBOL_COLUMN_MAX_SCALE = 1.4;

/**
 * A row's leading SF Symbol (iOS) in its color. Sized by a text style, so it grows with Dynamic
 * Type like the text beside it ("Increase the size of meaningful interface icons as font size
 * increases", HIG typography). Side by side with the title it sits in a fixed-width column; in a
 * stacked row (accessibility text sizes) it's on its own line, leading-aligned at its own width.
 */
export function RowSymbol({ symbol }: { symbol: FormSymbol }) {
  const isStacked = useIsAccessibilityTextSize();
  const columnWidth = useScaledSize(SYMBOL_COLUMN_WIDTH, SYMBOL_COLUMN_MAX_SCALE);

  return (
    <Image
      systemName={symbol.sf}
      color={symbol.color}
      modifiers={[
        font({ textStyle: 'title2' }),
        isStacked
          ? frame({ minHeight: SYMBOL_MIN_HEIGHT })
          : frame({ minWidth: columnWidth, maxWidth: columnWidth, minHeight: SYMBOL_MIN_HEIGHT }),
      ]}
    />
  );
}
