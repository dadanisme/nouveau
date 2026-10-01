import { Page } from '@/components/page';
import { BulkActionsBar, DeleteConfirmDialog } from '@/components/transactions/bulk-actions';
import { SummaryStrip } from '@/components/transactions/summary-strip';
import { TransactionPanel } from '@/components/transactions/transaction-panel';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { TransactionsToolbar } from '@/components/transactions/transactions-toolbar';
import { useWorkspace } from '@/contexts/workspace-context';
import { useDraftRow } from '@/hooks/use-draft-row';
import { useHotkey } from '@/hooks/use-hotkey';
import { useSummaryStrip } from '@/hooks/use-summary-strip';
import { useTransactionActions } from '@/hooks/use-transaction-actions';
import { useTransactionPanel } from '@/hooks/use-transaction-panel';
import { useTransactionsPage } from '@/hooks/use-transactions-page';
import { useTransactionsTable } from '@/hooks/use-transactions-table';
import { en } from '@/locales/en';
import { interpolate } from '@/utils/string';

const t = en.transactions;

function countLabel(shown: number, total: number): string {
  if (shown !== total) return interpolate(t.countFiltered, { count: shown, total });
  return total === 1 ? t.countOne : interpolate(t.count, { count: total });
}

export function TransactionsPage() {
  const { currentWorkspaceId, isLoading } = useWorkspace();

  if (currentWorkspaceId || isLoading) {
    // Filters, selection and the draft row are all workspace-specific (category ids
    // differ per workspace), so switching workspace starts the page afresh.
    return <TransactionsView key={currentWorkspaceId ?? 'loading'} />;
  }

  return (
    <Page title={t.title} fill>
      <div className="page-container py-16 text-center">
        <p className="font-medium">{t.noWorkspace}</p>
        <p className="text-muted-foreground">{en.workspace.noneMessage}</p>
      </div>
    </Page>
  );
}

function TransactionsView() {
  const page = useTransactionsPage();
  const actions = useTransactionActions(page.categories, page.range);
  const { table, selectedTransactions, clearSelection, editingCell, startEditing, stopEditing } =
    useTransactionsTable(page.transactions);
  const draftRow = useDraftRow({ categories: page.categories, onSubmit: actions.createFromDraft });

  const summary = useSummaryStrip({
    transactions: page.transactions,
    breakdownTransactions: page.breakdownTransactions,
    homeCurrency: page.homeCurrency,
    typeFilter: page.typeFilter,
    categoryFilter: page.categoryFilter,
    onCategoryFilterChange: page.setCategoryFilter,
  });

  const panel = useTransactionPanel(page.periodTransactions, page.isLoading);

  useHotkey('n', draftRow.openAtTop, actions.canCreate);

  return (
    <Page
      title={t.title}
      fill
      aside={
        panel.isOpen && (
          <TransactionPanel
            transaction={panel.transaction}
            isLoading={panel.isLoading}
            error={panel.error}
            categories={page.categories}
            onClose={panel.close}
            onEditDate={actions.editDate}
            onEditDescription={actions.editDescription}
            onEditCategory={actions.editCategory}
            onEditAmount={actions.editAmount}
            onEditCurrency={actions.editCurrency}
            // Same delete with Undo as the table; the panel has nothing left to show.
            onDelete={(transaction) => {
              actions.requestDelete([transaction]);
              panel.close();
            }}
          />
        )
      }
    >
      <TransactionsToolbar
        periodLabel={page.periodLabel}
        isCurrentMonth={page.isCurrentMonth}
        onPreviousMonth={page.goToPreviousMonth}
        onNextMonth={page.goToNextMonth}
        onCurrentMonth={page.goToCurrentMonth}
        visibleRange={page.range}
        customRange={page.customRange}
        onCustomRangeChange={page.setCustomRange}
        search={page.search}
        onSearchChange={page.setSearch}
        typeFilter={page.typeFilter}
        onTypeFilterChange={page.setTypeFilter}
        categories={page.categories}
        categoryFilter={page.categoryFilter}
        onCategoryFilterChange={page.setCategoryFilter}
        canCreate={actions.canCreate}
        onNew={draftRow.openAtTop}
      />

      {!page.error && (
        <SummaryStrip state={summary} currency={page.homeCurrency} isLoading={page.isLoading} />
      )}

      <div className="relative min-h-0 flex-1">
        <div className="page-container h-full overflow-auto">
          <TransactionsTable
            table={table}
            categories={page.categories}
            editingCell={editingCell}
            openId={panel.openId}
            draftRow={draftRow}
            homeCurrency={page.homeCurrency}
            isLoading={page.isLoading}
            error={page.error}
            hasFilters={page.hasFilters}
            canCreate={actions.canCreate}
            onRetry={page.retry}
            onClearFilters={page.clearFilters}
            onStartEdit={startEditing}
            onStopEdit={stopEditing}
            onEditDate={actions.editDate}
            onEditDescription={actions.editDescription}
            onEditCategory={actions.editCategory}
            onEditAmount={actions.editAmount}
            onDelete={(transaction) => actions.requestDelete([transaction])}
            onOpen={(transaction) => panel.open(transaction.id)}
          />
        </div>

        {selectedTransactions.length > 0 && (
          <BulkActionsBar
            count={selectedTransactions.length}
            categories={page.categories}
            onChangeCategory={(category) => {
              actions.changeCategory(selectedTransactions, category);
              clearSelection();
            }}
            onDelete={() => actions.requestDelete(selectedTransactions)}
            onClear={clearSelection}
          />
        )}
      </div>

      {!page.isLoading && !page.error && (
        <footer className="page-container flex h-8 shrink-0 items-center border-t text-xs text-muted-foreground">
          {countLabel(page.transactions.length, page.totalCount)}
        </footer>
      )}

      <DeleteConfirmDialog
        count={actions.pendingDeleteCount}
        onConfirm={actions.confirmDelete}
        onCancel={actions.cancelDelete}
      />
    </Page>
  );
}
