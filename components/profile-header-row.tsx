import { Button, HStack, Image, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityHint,
  accessibilityLabel,
  font,
  foregroundStyle,
} from '@expo/ui/swift-ui/modifiers';
import { Image as RNImage } from 'expo-image';
import { PlatformColor } from 'react-native';

import { useIsAccessibilityTextSize, useScaledSize } from '@/hooks/use-accessibility-text-size';

// The iOS Settings account row's avatar size, at the default text size.
const AVATAR_SIZE = 60;

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
const TERTIARY = foregroundStyle(PlatformColor('tertiaryLabel'));
const DECORATIVE = accessibilityHidden(true);

export type ProfileHeaderRowProps = {
  name: string;
  email: string;
  imageUri?: string | null;
  /** Makes the row a button with a disclosure chevron (Settings' account row opens Profile). */
  onPress?: () => void;
  /** What tapping the row does, for VoiceOver / TalkBack (e.g. "Opens your profile."). */
  accessibilityHint?: string;
};

/**
 * The profile header row: avatar (the stored image or the system person symbol), name and email.
 * With `onPress` it's a button with a chevron, like the account row at the top of iOS Settings;
 * without, a static row that reads as one VoiceOver element. The avatar grows with the text size;
 * at accessibility sizes it sits above the name.
 */
export function ProfileHeaderRow({
  name,
  email,
  imageUri,
  onPress,
  accessibilityHint: hint,
}: ProfileHeaderRowProps) {
  const isStacked = useIsAccessibilityTextSize();
  const size = useScaledSize(AVATAR_SIZE);

  const avatar = imageUri ? (
    <RNHostView matchContents>
      <RNImage
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        accessible={false}
      />
    </RNHostView>
  ) : (
    <Image systemName="person.crop.circle.fill" size={size} modifiers={[TERTIARY, DECORATIVE]} />
  );
  const text = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({ textStyle: 'title2', weight: 'semibold' }), PRIMARY]}>{name}</Text>
      <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY]}>{email}</Text>
    </VStack>
  );
  const content = isStacked ? (
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

  if (!onPress) {
    return <HStack modifiers={[accessibilityElement('combine')]}>{content}</HStack>;
  }

  return (
    <Button
      onPress={onPress}
      modifiers={[
        accessibilityLabel(`${name}, ${email}`),
        ...(hint ? [accessibilityHint(hint)] : []),
      ]}
    >
      <HStack>
        {content}
        <Spacer />
        <Image
          systemName="chevron.right"
          modifiers={[font({ textStyle: 'footnote', weight: 'semibold' }), TERTIARY, DECORATIVE]}
        />
      </HStack>
    </Button>
  );
}
