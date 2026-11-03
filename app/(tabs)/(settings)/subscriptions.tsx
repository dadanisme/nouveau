import { FormDetailRow } from '@/components/form-detail-row';
import { FormEmptyRow, FormLoadingRow, FormSection, NativeForm } from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useSubscriptionsScreen } from '@/hooks/use-subscriptions-screen';
import { k } from '@/locales/keys';

const SYMBOLS = {
  empty: { sf: 'star', material: 'star' },
  warning: { sf: 'exclamationmark.triangle', material: 'warning' },
} as const satisfies Record<string, FormSymbol>;

// The form must be the screen's root view: the native header collapses with its scroll.
export default function SubscriptionsScreen() {
  const { t } = useLanguage();
  const screen = useSubscriptionsScreen();

  return (
    <NativeForm onRefresh={screen.refresh}>
      {screen.isLoading ? (
        <FormLoadingRow />
      ) : screen.hasError ? (
        <FormEmptyRow title={t(k.subscriptions.loadFailed)} symbol={SYMBOLS.warning} />
      ) : screen.rows.length === 0 ? (
        <FormEmptyRow
          title={t(k.subscriptions.noSubscriptions)}
          description={t(k.subscriptions.noSubscriptionsMessage)}
          symbol={SYMBOLS.empty}
        />
      ) : (
        <FormSection>
          {screen.rows.map((row) => (
            <FormDetailRow
              key={row.id}
              title={row.title}
              subtitle={row.detail}
              status={{
                tone: row.isRevoked ? 'negative' : 'positive',
                label: t(row.isRevoked ? k.subscriptions.revoked : k.subscriptions.active),
              }}
            />
          ))}
        </FormSection>
      )}
    </NativeForm>
  );
}
