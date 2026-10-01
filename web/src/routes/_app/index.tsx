import { createFileRoute } from '@tanstack/react-router';

import { Page } from '@/components/page';
import { en } from '@/locales/en';

export const Route = createFileRoute('/_app/')({
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <Page title={en.transactions.title}>
      <p className="text-muted-foreground">{en.transactions.placeholder}</p>
    </Page>
  );
}
