import { Text, View } from 'react-native';

import { AnimatedTabScreen } from '@/components/animated-tab-screen';

export default function DashboardScreen() {
  return (
    <AnimatedTabScreen index={2}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Hello World - Dashboard</Text>
      </View>
    </AnimatedTabScreen>
  );
}
