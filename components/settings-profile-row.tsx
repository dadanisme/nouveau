import { HStack, Image, RNHostView, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { Image as RNImage } from 'expo-image';

import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';

// The iOS Settings account row's avatar size, at the default text size.
const AVATAR_SIZE = 60;

export type SettingsProfileRowProps = {
  name: string;
  email: string;
  imageUri?: string | null;
};

/**
 * The profile header row of the Settings form: avatar, name and email. Not interactive. The
 * avatar grows with the text size; at accessibility sizes it sits above the name.
 */
export function SettingsProfileRow({ name, email, imageUri }: SettingsProfileRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const size = useScaledSize(AVATAR_SIZE);

  const avatar = imageUri ? (
    <RNHostView matchContents>
      <RNImage
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    </RNHostView>
  ) : (
    <Image
      systemName="person.crop.circle.fill"
      size={size}
      modifiers={[foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}
    />
  );
  const text = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ textStyle: 'title2', weight: 'semibold' })]}>{name}</Text>
      <Text
        modifiers={[
          font({ textStyle: 'subheadline' }),
          foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
        ]}
      >
        {email}
      </Text>
    </VStack>
  );

  return isStacked ? (
    <VStack alignment="leading" spacing={8}>
      {avatar}
      {text}
    </VStack>
  ) : (
    <HStack spacing={14}>
      {avatar}
      {text}
    </HStack>
  );
}
