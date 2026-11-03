import { FormLoadingRow, FormPlaceholderRow } from '@/components/content-placeholder';
import { FormDetailRow } from '@/components/form-detail-row';
import { FormSection } from '@/components/native-form';
import { RefreshableForm } from '@/components/refreshable-form';
import { useLanguage } from '@/contexts/language';
import { useSubscriptionsScreen } from '@/hooks/use-subscriptions-screen';
import { k } from '@/locales/keys';

const ICONS = {
  empty: { sf: 'star', md: require('@/assets/icons/star.xml') },
  warning: { sf: 'exclamationmark.triangle', md: require('@/assets/icons/warning.xml') },
} as const;

// The form must be the screen's root view: the native header collapses with its scroll.
export default function SubscriptionsScreen() {
  const { t } = useLanguage();
  const screen = useSubscriptionsScreen();

  return (
    <RefreshableForm onRefresh={screen.refresh} isRefreshing={screen.isRefreshing}>
      {screen.isLoading ? (
        <FormLoadingRow />
      ) : screen.hasError ? (
        <FormPlaceholderRow title={t(k.subscriptions.loadFailed)} icon={ICONS.warning} />
      ) : screen.rows.length === 0 ? (
        <FormPlaceholderRow
          title={t(k.subscriptions.noSubscriptions)}
          message={t(k.subscriptions.noSubscriptionsMessage)}
          icon={ICONS.empty}
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
    </RefreshableForm>
  );
}
