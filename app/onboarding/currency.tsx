import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FormBottomAction } from '@/components/form-bottom-action';
import { FormListRow, FormSection, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useCurrencyStepScreen } from '@/hooks/use-currency-step-screen';
import { k } from '@/locales/keys';

/**
 * The currency step (#78): the device region's currency under Suggested, checked, then the other
 * currencies as check rows, and one Continue pinned under the list, so the suggestion is accepted
 * with a single tap. A brand-new account (`?for=account`) sees it once with no way back.
 */
export default function CurrencyStepScreen() {
  const { t } = useLanguage();
  const screen = useCurrencyStepScreen();

  return (
    <View style={styles.fill}>
      <Stack.Screen
        options={{
          headerBackVisible: !screen.isAccountMode,
          gestureEnabled: !screen.isAccountMode,
        }}
      />
      <NativeForm>
        <FormSection title={t(k.onboarding.suggested)} footer={t(k.onboarding.suggestedFooter)}>
          <FormListRow
            title={screen.suggested.title}
            value={screen.suggested.value}
            selected={screen.selection === screen.suggested.code}
            onPress={() => screen.select(screen.suggested.code)}
          />
        </FormSection>
        <FormSection title={t(k.onboarding.allCurrencies)}>
          {screen.others.map((row) => (
            <FormListRow
              key={row.code}
              title={row.title}
              value={row.value}
              selected={screen.selection === row.code}
              onPress={() => screen.select(row.code)}
            />
          ))}
        </FormSection>
      </NativeForm>
      <FormBottomAction
        title={t(k.onboarding.continue)}
        loading={screen.isSaving}
        disabled={!screen.canSubmit}
        onPress={screen.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
