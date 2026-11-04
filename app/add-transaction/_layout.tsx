import { Stack } from 'expo-router';

import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * The add/edit transaction sheet's own Stack, so what it opens on iOS (Select Category, View
 * Proofs) pushes inside the sheet with the system Back instead of stacking a second sheet (HIG
 * sheets). Android keeps its full-screen modal; its pickers stay root sheets.
 */
export default function AddTransactionLayout() {
  const { t } = useLanguage();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? t(k.addTransaction.editTransaction)
            : t(k.addTransaction.addTransaction),
        })}
      />
      <Stack.Screen name="category-picker" options={{ title: t(k.categoryPicker.title) }} />
      <Stack.Screen name="proofs" options={{ title: t(k.proofs.title) }} />
    </Stack>
  );
}
