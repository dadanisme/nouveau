import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';

interface TypeToggleProps {
  value: 'income' | 'expense';
  onChange: (type: 'income' | 'expense') => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  // 0 = income, 1 = expense
  const progress = useSharedValue(value === 'expense' ? 1 : 0);

  const handlePress = (type: 'income' | 'expense') => {
    if (type === value) return;
    progress.value = withSpring(type === 'expense' ? 1 : 0, design.animation.tabSwitch);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(type);
  };

  const incomeStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.income, 'transparent']),
  }));

  const expenseStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', colors.expense]),
  }));

  return (
    <View style={styles.container}>
      <Pressable style={styles.segment} onPress={() => handlePress('income')}>
        <AnimatedView style={[styles.segmentInner, incomeStyle]}>
          <Text style={[styles.label, value === 'income' && styles.labelActive]}>Income</Text>
        </AnimatedView>
      </Pressable>
      <Pressable style={styles.segment} onPress={() => handlePress('expense')}>
        <AnimatedView style={[styles.segmentInner, expenseStyle]}>
          <Text style={[styles.label, value === 'expense' && styles.labelActive]}>Expense</Text>
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
    color: colors.white,
    fontWeight: '800',
  },
});
