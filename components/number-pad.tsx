import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SHADOW_OFFSET = design.shadow.shadowOffset.width;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

interface NumberPadProps {
  onKeyPress: (key: string) => void;
}

function PadKey({ label, onPress }: { label: string; onPress: () => void }) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * SHADOW_OFFSET },
      { translateY: pressed.value * SHADOW_OFFSET },
    ],
    shadowOffset: {
      width: SHADOW_OFFSET * (1 - pressed.value),
      height: SHADOW_OFFSET * (1 - pressed.value),
    },
  }));

  return (
    <AnimatedPressable
      style={[styles.key, animatedStyle]}
      onPressIn={() => {
        pressed.value = withSpring(1, design.animation.pressIn);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, design.animation.pressOut);
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {label === 'backspace' ? (
        <Ionicons name="backspace-outline" size={24} color={colors.gray[900]} />
      ) : (
        <Text style={styles.keyText}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

export function NumberPad({ onKeyPress }: NumberPadProps) {
  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <PadKey key={key} label={key} onPress={() => onKeyPress(key)} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: design.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.md - 2,
    backgroundColor: colors.white,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    borderRadius: design.radius.md,
    ...design.shadow,
  },
  keyText: {
    fontSize: design.fontSize.xl,
    fontWeight: '800',
    color: colors.gray[900],
  },
});
