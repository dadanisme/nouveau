import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, design } from '@/constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  icon: IconName;
  activeIcon: IconName;
  label: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  transactions: { icon: 'wallet-outline', activeIcon: 'wallet', label: 'Transactions' },
  dashboard: { icon: 'grid-outline', activeIcon: 'grid', label: 'Dashboard' },
  'add-transaction': { icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Add' },
};

const ACTION_TAB = 'add-transaction';
const TAB_SIZE = 48;
const TAB_WIDTH = 64;
const ACTION_TAB_SIZE = 128;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// Height estimate for screens to use as bottom padding
// paddingTop(sm) + bar padding(sm*2) + tab height + extra breathing room
export const TAB_BAR_HEIGHT =
  design.spacing.sm + design.spacing.sm * 2 + TAB_SIZE + design.spacing.md;

interface AnimatedTabProps {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  config: TabConfig;
  isAction: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function AnimatedTab({
  route,
  isFocused,
  config,
  isAction,
  onPress,
  onLongPress,
}: AnimatedTabProps) {
  const scale = useSharedValue(1);
  const active = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(isFocused ? 1 : 0, design.animation.tabSwitch);
  }, [isFocused, active]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(active.value, [0, 1], [colors.white, colors.primary.DEFAULT]),
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - active.value,
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, design.animation.pressIn);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, design.animation.pressOut);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tab, isAction && styles.actionTab, containerStyle]}
    >
      <View style={styles.iconContainer}>
        <AnimatedIonicons
          name={config.icon}
          size={22}
          color={colors.gray[900]}
          style={[styles.iconBase, inactiveIconStyle]}
        />
        <AnimatedIonicons
          name={config.activeIcon}
          size={22}
          color={colors.gray[900]}
          style={[styles.iconBase, styles.iconOverlay, activeIconStyle]}
        />
      </View>
      {isAction && <Text style={styles.label}>{config.label}</Text>}
    </AnimatedPressable>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, design.spacing.sm) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const isFocused = state.index === index;
          const isAction = route.name === ACTION_TAB;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <AnimatedTab
              key={route.key}
              route={route}
              isFocused={isFocused}
              config={config}
              isAction={isAction}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: design.spacing.md,
    paddingTop: design.spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.black,
    borderRadius: design.radius.lg,
    padding: design.spacing.sm,
    gap: design.spacing.sm,
  },
  tab: {
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: design.radius.md,
    height: TAB_SIZE,
  },
  actionTab: {
    flexDirection: 'row',
    width: ACTION_TAB_SIZE,
    gap: design.spacing.sm,
  },
  iconContainer: {
    width: 22,
    height: 22,
  },
  iconBase: {
    position: 'absolute',
  },
  iconOverlay: {
    position: 'absolute',
  },
  label: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
});
