import { Stack } from 'expo-router';

import { LARGE_TITLE_OPTIONS } from '@/constants/large-title';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

export default function TransactionsLayout() {
  const { t } = useLanguage();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ ...LARGE_TITLE_OPTIONS, title: t(k.transactions.title) }}
      />
    </Stack>
  );
}
