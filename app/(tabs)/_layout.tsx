import { Dimensions, Easing } from 'react-native';

import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        lazy: false,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="dashboard" />
    </Tabs>
  );
}
