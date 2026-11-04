import {
  Box,
  Column,
  HorizontalDivider,
  Row,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxHeight,
  fillMaxWidth,
  height,
  matchParentSize,
  offset,
  padding,
  semantics,
  Shapes,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';

import { useScaledSize } from '@/hooks/use-accessibility-text-size';
import { useMonthlyChart, type MonthlySpendingChartProps } from '@/hooks/use-monthly-chart';

// Material 3 list padding, and a plot tall enough to compare twelve bars.
const SIDE = 16;
const PLOT_HEIGHT = 160;
const BAR_GAP = 4;
// The `labelSmall` line height at the default font scale.
const TICK_LABEL_HEIGHT = 16;
const BAR_SHAPE = Shapes.RoundedCorner({ topStart: 4, topEnd: 4 });

/**
 * A year's spending per month as Compose bars in the list: bars from zero with grid lines and
 * compact ticks on the trailing side, the current month in the accent (`primary`) and bold. A
 * TalkBack user hears the summary, then each month with its full amount.
 */
export function MonthlySpendingChart(props: MonthlySpendingChartProps) {
  const chart = useMonthlyChart(props);
  const colors = useMaterialColors();
  // A tick label's height at the current font scale (Android caps it at 2x).
  const tickLabelHeight = useScaledSize(TICK_LABEL_HEIGHT);
  const upperBound = Math.max(chart.ticks[chart.ticks.length - 1]?.value ?? 0, 1);
  const ticksFromTop = [...chart.ticks].reverse();

  return (
    <Row
      horizontalArrangement={{ spacedBy: 8 }}
      modifiers={[
        fillMaxWidth(),
        padding(SIDE, 8, SIDE, 16),
        semantics({ contentDescription: `${chart.title}. ${chart.summary}` }),
      ]}
    >
      <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[weight(1)]}>
        <Box modifiers={[fillMaxWidth(), height(PLOT_HEIGHT)]}>
          <Column verticalArrangement="spaceBetween" modifiers={[matchParentSize()]}>
            {ticksFromTop.map((tick) => (
              <HorizontalDivider key={tick.value} color={colors.outlineVariant} />
            ))}
          </Column>
          <Row
            horizontalArrangement={{ spacedBy: BAR_GAP }}
            verticalAlignment="bottom"
            modifiers={[matchParentSize()]}
          >
            {chart.bars.map((bar) => (
              <Box
                key={bar.id}
                modifiers={[
                  weight(1),
                  fillMaxHeight(bar.value / upperBound),
                  clip(BAR_SHAPE),
                  background(bar.isHighlighted ? colors.primary : colors.outline),
                ]}
              />
            ))}
          </Row>
        </Box>
        <Row horizontalArrangement={{ spacedBy: BAR_GAP }} modifiers={[fillMaxWidth()]}>
          {chart.bars.map((bar) => (
            <Text
              key={bar.id}
              color={bar.isHighlighted ? colors.onSurface : colors.onSurfaceVariant}
              style={{
                typography: 'labelSmall',
                textAlign: 'center',
                fontWeight: bar.isHighlighted ? 'bold' : undefined,
              }}
              modifiers={[
                weight(1),
                semantics({ contentDescription: `${bar.accessibilityLabel}, ${bar.valueLabel}` }),
              ]}
            >
              {bar.axisLabel}
            </Text>
          ))}
        </Row>
      </Column>
      {/* Half a label taller at each end, so each label centers on its grid line. */}
      <Column
        verticalArrangement="spaceBetween"
        modifiers={[height(PLOT_HEIGHT + tickLabelHeight), offset(0, -tickLabelHeight / 2)]}
      >
        {ticksFromTop.map((tick) => (
          <Text
            key={tick.value}
            color={colors.onSurfaceVariant}
            style={{ typography: 'labelSmall' }}
          >
            {tick.label}
          </Text>
        ))}
      </Column>
    </Row>
  );
}
