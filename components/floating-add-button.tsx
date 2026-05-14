import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';

const FAB_SIZE = 64;

export const FAB_HEIGHT = FAB_SIZE + design.spacing.md;

export function FloatingAddButton() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom, design.spacing.sm) + design.spacing.sm },
      ]}
    >
      <Button
        variant="primary"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/add-transaction');
        }}
        style={styles.button}
      >
        <Ionicons name="add" size={28} color={colors.gray[900]} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: design.radius.lg,
  },
});
