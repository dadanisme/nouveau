import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SHADOW_OFFSET = design.shadowOffset;

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: 'primary' | 'outline' | 'dark';
  style?: ViewStyle | (ViewStyle | false | undefined)[];
  children: React.ReactNode;
}

export function Button({ variant = 'primary', style, children, disabled, ...props }: ButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = SHADOW_OFFSET * (1 - pressed.value);
    return {
      transform: [
        { translateX: pressed.value * SHADOW_OFFSET },
        { translateY: pressed.value * SHADOW_OFFSET },
      ],
      boxShadow: `${offset}px ${offset}px 0px #000000`,
    };
  });

  return (
    <AnimatedPressable
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'dark' && styles.dark,
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}
      onPressIn={() => {
        pressed.value = withSpring(1, design.animation.pressIn);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, design.animation.pressOut);
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
    borderRadius: design.radius.md,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    gap: design.spacing.sm,
    ...design.shadow,
  },
  primary: {
    backgroundColor: colors.primary.DEFAULT,
  },
  outline: {
    backgroundColor: colors.white,
  },
  dark: {
    backgroundColor: colors.black,
  },
  disabled: {
    opacity: 0.5,
  },
});
