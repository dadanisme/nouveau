import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import { getInitials } from '@/utils/string';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = '', size = 48 }: AvatarProps) {
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: design.borderWidth,
    borderColor: colors.black,
  },
  fallback: {
    backgroundColor: colors.primary.light,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
    color: colors.primary.dark,
  },
});
