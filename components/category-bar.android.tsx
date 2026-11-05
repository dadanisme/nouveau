import { Box, Column, FlowRow, Row, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  clip,
  fillMaxWidth,
  height,
  padding,
  semantics,
  Shapes,
  size,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';

import type { CategoryBarProps } from '@/components/category-bar';
import { useScaledSize } from '@/hooks/use-accessibility-text-size';

// Material 3 list padding, and a pill bar a little taller than a progress indicator.
const SIDE = 16;
const BAR_HEIGHT = 12;
const BAR_SHAPE = Shapes.RoundedCorner(BAR_HEIGHT / 2);
// The gap between segments, which shows the surface through it as a separator.
const SEPARATOR = 2;
const DOT_SIZE = 8;

/**
 * A period's spending as a storage-style bar (#90) in the list: the total, a pill split into a
 * segment per category (gaps between them as separators), and a wrapping legend of names and
 * percents. The whole item is clickable and opens Insights; TalkBack reads the summary.
 * `accessibilityHint` is iOS-only: Compose has no hint, and the item is announced as actionable.
 */
export function CategoryBar({ segments, headline, accessibilityLabel, onPress }: CategoryBarProps) {
  const colors = useMaterialColors();
  // The legend dots grow with the font scale, beside the text they mark.
  const dotSize = useScaledSize(DOT_SIZE);
  const drawn = segments.filter((segment) => segment.value > 0);

  return (
    <Column
      verticalArrangement={{ spacedBy: 12 }}
      modifiers={[
        fillMaxWidth(),
        clickable(onPress),
        semantics({ contentDescription: accessibilityLabel }),
        padding(SIDE, 12, SIDE, 12),
      ]}
    >
      <Text color={colors.onSurface} style={{ typography: 'titleMedium' }}>
        {headline}
      </Text>
      <Row
        horizontalArrangement={{ spacedBy: SEPARATOR }}
        modifiers={[fillMaxWidth(), height(BAR_HEIGHT), clip(BAR_SHAPE)]}
      >
        {drawn.map((segment) => (
          <Box
            key={segment.id}
            modifiers={[weight(segment.value), height(BAR_HEIGHT), background(segment.color)]}
          />
        ))}
      </Row>
      <FlowRow
        horizontalArrangement={{ spacedBy: 16 }}
        verticalArrangement={{ spacedBy: 4 }}
        modifiers={[fillMaxWidth()]}
      >
        {segments.map((segment) => (
          <Row key={segment.id} horizontalArrangement={{ spacedBy: 6 }} verticalAlignment="center">
            <Box
              modifiers={[size(dotSize, dotSize), clip(Shapes.Circle), background(segment.color)]}
            />
            <Text color={colors.onSurface} style={{ typography: 'bodySmall' }}>
              {segment.name}
            </Text>
            <Text color={colors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
              {segment.shareLabel}
            </Text>
          </Row>
        ))}
      </FlowRow>
    </Column>
  );
}
