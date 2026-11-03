import { HStack, Image, RNHostView, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import { Image as RNImage } from 'expo-image';
import { StyleSheet } from 'react-native';

// The iOS Settings account row's avatar size.
const AVATAR_SIZE = 60;

export type SettingsProfileRowProps = {
  name: string;
  email: string;
  imageUri?: string | null;
};

/** The profile header row of the Settings form: avatar, name and email. Not interactive. */
export function SettingsProfileRow({ name, email, imageUri }: SettingsProfileRowProps) {
  return (
    <HStack spacing={14}>
      {imageUri ? (
        <RNHostView matchContents>
          <RNImage source={{ uri: imageUri }} style={styles.avatar} contentFit="cover" />
        </RNHostView>
      ) : (
        <Image
          systemName="person.crop.circle.fill"
          size={AVATAR_SIZE}
          modifiers={[foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}
        />
      )}
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
    </HStack>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
});
