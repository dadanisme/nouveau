import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import { getAddActionPlacement } from '@/utils/platform';

export const unstable_settings = {
  anchor: '(transactions)',
};

export default function TabsLayout() {
  const { t } = useLanguage();
  const router = useRouter();
  const showTabBarAddAction = getAddActionPlacement() === 'tabBar';

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
      {/* Add action in the separate round slot (iOS 26.1+). `role="search"` is what gives the
          tab its own slot; `disabled` stops the native selection, so the tap only emits
          `tabPress` and presents the add sheet. Hidden where the slot doesn't exist. */}
      <NativeTabs.Trigger
        name="add-action"
        role="search"
        disabled
        hidden={!showTabBarAddAction}
        accessibilityLabel={t(k.addTransaction.addTransaction)}
        listeners={{
          tabPress: () => router.push('/add-transaction'),
        }}
      >
        <NativeTabs.Trigger.Icon sf="plus" md="add" />
        <NativeTabs.Trigger.Label>{t(k.addTransaction.addTransaction)}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
