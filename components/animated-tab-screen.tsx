import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

const ActiveTabContext = createContext<SharedValue<number> | null>(null);

export const ActiveTabProvider = ActiveTabContext.Provider;

interface AnimatedTabScreenProps {
  index: number;
  children: React.ReactNode;
}

export function AnimatedTabScreen({ index, children }: AnimatedTabScreenProps) {
  const { width } = useWindowDimensions();
  const activeIndex = useContext(ActiveTabContext);
  if (!activeIndex) throw new Error('AnimatedTabScreen must be inside ActiveTabProvider');

  const translateX = useDerivedValue(() =>
    withTiming((index - activeIndex.value) * width, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    }),
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
