import { HStack, Image, Label, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  textSelection,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import type { FormDetailRowProps } from '@/components/form-extras-types';

const SECONDARY = foregroundStyle({ type: 'hierarchical', style: 'secondary' });

/**
 * A non-interactive row: title, optional secondary line, optional leading icon and an optional
 * trailing status glyph (green check / red cross).
 */
export function FormDetailRow({ title, subtitle, icon, status, selectable }: FormDetailRowProps) {
  const text = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={selectable ? [textSelection(true)] : undefined}>{title}</Text>
      {subtitle ? (
        <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{subtitle}</Text>
      ) : null}
    </VStack>
  );

  return (
    <HStack>
      {icon ? <Label systemImage={icon.sf}>{text}</Label> : text}
      {status ? (
        <>
          <Spacer />
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
        </>
      ) : null}
    </HStack>
  );
}
