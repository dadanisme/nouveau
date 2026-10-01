import { createFileRoute } from '@tanstack/react-router';

import { TransactionsPage } from '@/components/transactions/transactions-page';

interface TransactionsSearch {
  /** Id of the transaction open in the side panel. */
  tx?: string;
}

export const Route = createFileRoute('/_app/')({
  validateSearch: (search: Record<string, unknown>): TransactionsSearch => ({
    tx: typeof search.tx === 'string' && search.tx ? search.tx : undefined,
  }),
  component: TransactionsPage,
});
