import { RNHostView } from '@expo/ui/swift-ui';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { FormImageRowProps } from '@/components/form-extras-types';

const PREVIEW_HEIGHT = 220;

/** An image preview filling a form row: full row width, fixed height, aspect-fit. */
export function FormImageRow({ uri, accessibilityLabel }: FormImageRowProps) {
  return (
    <RNHostView matchContents={{ vertical: true }}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        accessible
        accessibilityLabel={accessibilityLabel}
      />
    </RNHostView>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: PREVIEW_HEIGHT },
});
