import { createFileRoute } from '@tanstack/react-router';

import { TransactionsPage } from '@/components/transactions/transactions-page';

export const Route = createFileRoute('/_app/')({
  component: TransactionsPage,
});
