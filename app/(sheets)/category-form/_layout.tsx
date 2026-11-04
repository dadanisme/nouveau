import { Stack } from 'expo-router';

import { SHEET_HAS_HEADER } from '@/constants/sheet-options';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * The category form sheet's own Stack, so the icon and color pickers push inside the sheet on iOS
 * with the system Back instead of stacking a second sheet (HIG sheets). Android form sheets have
 * no header, so the Stack hides it and the pickers stay root sheets there.
 */
export default function CategoryFormLayout() {
  const { t } = useLanguage();

  return (
    <Stack screenOptions={{ headerShown: SHEET_HAS_HEADER }}>
      <Stack.Screen
        name="index"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? t(k.categories.editCategory)
            : t(k.categories.newCategory),
        })}
      />
      <Stack.Screen name="icon-picker" options={{ title: t(k.categories.chooseIcon) }} />
      <Stack.Screen name="color-picker" options={{ title: t(k.categories.chooseColor) }} />
    </Stack>
  );
}
