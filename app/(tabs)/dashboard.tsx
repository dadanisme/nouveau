import { Text, View } from 'react-native';

import { AnimatedTabScreen } from '@/components/animated-tab-screen';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

export default function DashboardScreen() {
  const { t } = useLanguage();

  return (
    <AnimatedTabScreen index={2}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t(k.dashboard.placeholder)}</Text>
      </View>
    </AnimatedTabScreen>
  );
}
