import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: readonly [SegmentedToggleOption<T>, SegmentedToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const [first, second] = options;
  // 0 = first option, 1 = second option
  const progress = useSharedValue(value === second.value ? 1 : 0);

  const handlePress = (next: T) => {
    if (next === value) return;
    progress.value = withSpring(next === second.value ? 1 : 0, design.animation.tabSwitch);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(next);
  };

  const firstStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.primary.DEFAULT, 'transparent'],
    ),
  }));

  const secondStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.primary.DEFAULT],
    ),
  }));

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.segment}
        accessibilityRole="button"
        accessibilityLabel={first.label}
        accessibilityState={{ selected: value === first.value }}
        onPress={() => handlePress(first.value)}
      >
        <AnimatedView style={[styles.segmentInner, firstStyle]}>
          <Text style={[styles.label, value === first.value && styles.labelActive]}>
            {first.label}
          </Text>
        </AnimatedView>
      </Pressable>
      <Pressable
        style={styles.segment}
        accessibilityRole="button"
        accessibilityLabel={second.label}
        accessibilityState={{ selected: value === second.value }}
        onPress={() => handlePress(second.value)}
      >
        <AnimatedView style={[styles.segmentInner, secondStyle]}>
          <Text style={[styles.label, value === second.value && styles.labelActive]}>
            {second.label}
          </Text>
        </AnimatedView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    borderRadius: design.radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...design.shadow,
  },
  segment: {
    flex: 1,
  },
  segmentInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.sm + 2,
    borderRadius: design.radius.md - design.borderWidth,
  },
  label: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[400],
  },
  labelActive: {
    color: colors.gray[900],
    fontWeight: '800',
  },
});
