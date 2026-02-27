import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/constants/colors';

interface SplashOverlayProps {
  isReady: boolean;
}

export function SplashOverlay({ isReady }: SplashOverlayProps) {
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isReady) return;

    SplashScreen.hideAsync();

    requestAnimationFrame(() => {
      opacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withTiming(
        1.05,
        {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(setVisible, false);
          }
        },
      );
    });
  }, [isReady, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Image source={require('@/assets/images/splash-icon.png')} style={styles.icon} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});
