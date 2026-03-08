import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  icon: IconName;
  activeIcon: IconName;
  label: string;
}

function getTabConfig(): Record<string, TabConfig> {
  return {
    index: { icon: 'home-outline', activeIcon: 'home', label: i18n.t(k.tabBar.home) },
    transactions: {
      icon: 'wallet-outline',
      activeIcon: 'wallet',
      label: i18n.t(k.tabBar.transactions),
    },
    dashboard: { icon: 'grid-outline', activeIcon: 'grid', label: i18n.t(k.tabBar.dashboard) },
  };
}
const TAB_SIZE = 48;
const ACTIVE_TAB_WIDTH = 148;

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// Height estimate for screens to use as bottom padding
export const TAB_BAR_HEIGHT =
  design.spacing.sm + design.spacing.sm * 2 + TAB_SIZE + design.spacing.md;

interface AnimatedTabProps {
  route: BottomTabBarProps['state']['routes'][number];
  isFocused: boolean;
  config: TabConfig;
  onPress: () => void;
  onLongPress: () => void;
}

function AnimatedTab({ route, isFocused, config, onPress, onLongPress }: AnimatedTabProps) {
  const active = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(isFocused ? 1 : 0, design.animation.tabSwitch);
  }, [isFocused, active]);

  const containerStyle = useAnimatedStyle(() => ({
    width: TAB_SIZE + active.value * (ACTIVE_TAB_WIDTH - TAB_SIZE),
    backgroundColor: interpolateColor(active.value, [0, 1], [colors.white, colors.primary.DEFAULT]),
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - active.value,
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: active.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    maxWidth: active.value * 100,
    marginLeft: active.value * design.spacing.xs,
  }));

  return (
    <Animated.View
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onTouchEnd={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.tab, containerStyle]}
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
          style={[styles.iconBase, activeIconStyle]}
        />
      </View>
      <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {config.label}
      </Animated.Text>
    </Animated.View>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabConfig = getTabConfig();

  const createHandlers = (route: (typeof state.routes)[number], index: number) => ({
    onPress: () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (state.index !== index && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    onLongPress: () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    },
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, design.spacing.sm) }]}>
      <View style={styles.row}>
        {/* Navigation tabs group */}
        <View style={styles.navBar}>
          {state.routes.map((route, index) => {
            const config = tabConfig[route.name];
            if (!config) return null;
            const handlers = createHandlers(route, index);
            return (
              <AnimatedTab
                key={route.key}
                route={route}
                isFocused={state.index === index}
                config={config}
                {...handlers}
              />
            );
          })}
        </View>

        {/* Action button */}
        <Button
          variant="outline"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-transaction');
          }}
          style={styles.actionButton}
        >
          <Ionicons name="add" size={24} color={colors.gray[900]} />
        </Button>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: design.radius.lg,
    padding: design.spacing.sm,
    gap: design.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: design.radius.md,
    height: TAB_SIZE,
    overflow: 'visible',
  },
  actionButton: {
    width: TAB_SIZE + design.spacing.sm * 2,
    height: TAB_SIZE + design.spacing.sm * 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: design.radius.lg,
  },
  iconContainer: {
    width: 22,
    height: 22,
  },
  iconBase: {
    position: 'absolute',
  },
  label: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
});
