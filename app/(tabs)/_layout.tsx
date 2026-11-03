import { NativeTabs } from 'expo-router/native-tabs';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

export const unstable_settings = {
  anchor: '(transactions)',
};

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <NativeTabs tintColor={ACCENT_COLOR} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(transactions)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          md="receipt_long"
        />
        <NativeTabs.Trigger.Label>{t(k.transactions.title)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(insights)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.pie', selected: 'chart.pie.fill' }}
          md="pie_chart"
        />
        <NativeTabs.Trigger.Label>{t(k.insights.title)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>{t(k.settings.title)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
