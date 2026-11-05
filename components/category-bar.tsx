import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityHidden,
  accessibilityHint,
  accessibilityLabel,
  font,
  foregroundStyle,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import { CategoryBarChart } from '@/modules/native-charts';
import type { CategoryBarModel } from '@/utils/category-bar';

export type CategoryBarProps = CategoryBarModel & {
  /** Opens Insights for the same period. */
  onPress: () => void;
};

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const TERTIARY = foregroundStyle(PlatformColor('tertiaryLabel'));

/**
 * A period's spending as a storage-style bar (#90), drawn as a native `Form` row: the total, then
 * the Swift Charts bar and its legend (`modules/native-charts`). The row is a button that opens
 * Insights, with a chevron, and VoiceOver reads it as one element with the summary and a hint.
 * Place it directly in a `FormSection`.
 */
export function CategoryBar({
  segments,
  headline,
  accessibilityLabel: label,
  accessibilityHint: hint,
  onPress,
}: CategoryBarProps) {
  return (
    <Button onPress={onPress} modifiers={[accessibilityLabel(label), accessibilityHint(hint)]}>
      <VStack alignment="leading" spacing={10}>
        <HStack>
          <Text modifiers={[PRIMARY, font({ textStyle: 'headline' })]}>{headline}</Text>
          <Spacer />
          <Image
            systemName="chevron.right"
            modifiers={[
              font({ textStyle: 'footnote', weight: 'semibold' }),
              TERTIARY,
              accessibilityHidden(true),
            ]}
          />
        </HStack>
        <CategoryBarChart segments={segments} summary={label} />
      </VStack>
    </Button>
  );
}
