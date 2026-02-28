import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useLayoutEffect } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { ActiveTabProvider } from '@/components/animated-tab-screen';
import { TabBar } from '@/components/tab-bar';
import { colors } from '@/constants/colors';

function TabBarWithSync({
  activeIndex,
  ...props
}: BottomTabBarProps & { activeIndex: SharedValue<number> }) {
  useLayoutEffect(() => {
    activeIndex.value = props.state.index;
  }, [props.state.index, activeIndex]);

  return <TabBar {...props} />;
}

export default function TabLayout() {
  const activeIndex = useSharedValue(0);

  return (
    <ActiveTabProvider value={activeIndex}>
      <Tabs
        tabBar={(props) => <TabBarWithSync {...props} activeIndex={activeIndex} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          animation: 'none',
          lazy: false,
          freezeOnBlur: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="transactions" />
        <Tabs.Screen name="dashboard" />
      </Tabs>
    </ActiveTabProvider>
  );
}
