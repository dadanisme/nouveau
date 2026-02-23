import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

// Height estimate for screens to use as bottom padding
// paddingTop(sm) + bar padding(sm*2) + tab height + extra breathing room
export const TAB_BAR_HEIGHT =
  design.spacing.sm + design.spacing.sm * 2 + TAB_SIZE + design.spacing.md;

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
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isAction && styles.actionTab, isFocused && styles.activeTab]}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={22}
                color={colors.gray[900]}
              />
              {isAction && <Text style={styles.label}>{config.label}</Text>}
            </Pressable>
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
    backgroundColor: colors.black,
    borderRadius: design.radius.lg,
    padding: design.spacing.sm,
    gap: design.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: design.radius.md,
    height: TAB_SIZE,
  },
  actionTab: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.primary.DEFAULT,
  },
  label: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
});
