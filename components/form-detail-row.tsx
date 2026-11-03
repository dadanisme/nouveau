import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  textSelection,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import type { FormDetailRowProps } from '@/components/form-extras-types';
import { RowSymbol } from '@/components/row-symbol';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';

const SECONDARY = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

/**
 * A non-interactive row: title, optional secondary line, optional leading symbol and an optional
 * trailing status glyph (green check / red cross). At accessibility text sizes the symbol moves
 * above the text, so the text keeps the row's width.
 */
export function FormDetailRow({ title, subtitle, symbol, status, selectable }: FormDetailRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const text = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={selectable ? [textSelection(true)] : undefined}>{title}</Text>
      {subtitle ? (
        <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{subtitle}</Text>
      ) : null}
    </VStack>
  );

  return (
    <HStack spacing={12}>
      {symbol && isStacked ? (
        <VStack alignment="leading" spacing={4}>
          <RowSymbol symbol={symbol} />
          {text}
        </VStack>
      ) : (
        <>
          {symbol ? <RowSymbol symbol={symbol} /> : null}
          {text}
        </>
      )}
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
