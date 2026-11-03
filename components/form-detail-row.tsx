import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  textSelection,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import type { FormDetailRowProps } from '@/components/form-extras-types';

const SECONDARY = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
// Same leading glyph box as `FormListRow`, so titles line up across rows.
const SYMBOL_WIDTH = 28;

/**
 * A non-interactive row: title, optional secondary line, optional leading symbol and an optional
 * trailing status glyph (green check / red cross).
 */
export function FormDetailRow({ title, subtitle, symbol, status, selectable }: FormDetailRowProps) {
  return (
    <HStack spacing={12}>
      {symbol ? (
        <Image
          systemName={symbol.sf}
          color={symbol.color}
          modifiers={[frame({ width: SYMBOL_WIDTH, height: SYMBOL_WIDTH })]}
        />
      ) : null}
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={selectable ? [textSelection(true)] : undefined}>{title}</Text>
        {subtitle ? (
          <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{subtitle}</Text>
        ) : null}
      </VStack>
      <Spacer />
      {status ? (
        <Image
          systemName={status.tone === 'positive' ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
          modifiers={[
            font({ textStyle: 'title3' }),
            foregroundStyle(
              PlatformColor(status.tone === 'positive' ? 'systemGreen' : 'systemRed'),
            ),
            accessibilityLabel(status.label),
          ]}
        />
      ) : null}
    </HStack>
  );
}
