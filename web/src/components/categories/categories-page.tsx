import { CheckIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';

import { ColorPicker } from '@/components/categories/color-picker';
import { IconPicker } from '@/components/categories/icon-picker';
import { Page } from '@/components/page';
import { TextCellEditor } from '@/components/transactions/cell-editors';
import { CELL_CLASS } from '@/components/transactions/table-styles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/contexts/workspace-context';
import {
  type CategoryDraft,
  type CategoryManagement,
  useCategoryManagement,
} from '@/hooks/use-category-management';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category, TransactionType } from '@/types/transaction';
import { CATEGORY_NAME_MAX_LENGTH, toIconValue } from '@/utils/category';
import { interpolate } from '@/utils/string';

const t = en.categories;

const HEADER_CLASS = 'h-8 border-y p-0 px-2 text-left text-xs font-medium text-muted-foreground';
const ICON_BUTTON_CLASS =
  'flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

const TYPE_LABELS: Record<TransactionType, string> = {
  expense: en.transactions.expense,
  income: en.transactions.income,
};

export function CategoriesPage() {
  const { currentWorkspaceId, isLoading } = useWorkspace();

  return (
    <Page title={t.title}>
      {currentWorkspaceId || isLoading ? (
        // Categories belong to a workspace, so switching starts the page afresh.
        <CategoriesView key={currentWorkspaceId ?? 'loading'} />
      ) : (
        <div className="py-16 text-center">
          <p className="font-medium">{en.workspace.none}</p>
          <p className="text-muted-foreground">{en.workspace.noneMessage}</p>
        </div>
      )}
    </Page>
  );
}

function CategoriesView() {
  const management = useCategoryManagement();

  if (management.error) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="font-medium">{t.loadFailed}</p>
        <p className="text-muted-foreground">{management.error.message}</p>
        <Button variant="outline" size="sm" onClick={management.retry}>
          {t.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {management.groups.map((group) => (
        <CategorySection
          key={group.type}
          type={group.type}
          categories={group.categories}
          management={management}
        />
      ))}
      <DeleteCategoryDialog management={management} />
    </div>
  );
}

interface CategorySectionProps {
  type: TransactionType;
  categories: Category[];
  management: CategoryManagement;
}

function CategorySection({ type, categories, management }: CategorySectionProps) {
  const headingId = `categories-${type}`;
  const draft = management.draft?.type === type ? management.draft : null;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="flex h-8 items-center gap-2 font-semibold">
        {TYPE_LABELS[type]}
        {!management.isLoading && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {categories.length}
          </span>
        )}
      </h2>

      <table className="w-full table-fixed border-separate border-spacing-0">
        <colgroup>
          <col style={{ width: '44px' }} />
          <col />
          <col style={{ width: '128px' }} />
          <col style={{ width: '68px' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={HEADER_CLASS}>
              {t.columns.icon}
            </th>
            <th scope="col" className={cn(HEADER_CLASS, 'border-l')}>
              {t.columns.name}
            </th>
            <th scope="col" className={cn(HEADER_CLASS, 'border-l')}>
              {t.columns.color}
            </th>
            <th scope="col" className={HEADER_CLASS}>
              <span className="sr-only">{t.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {management.isLoading ? (
            <SkeletonRows />
          ) : (
            categories.map((category) => (
              <CategoryRow key={category.id} category={category} management={management} />
            ))
          )}

          {!management.isLoading && categories.length === 0 && !draft && (
            <tr>
              <td colSpan={4} className={cn(CELL_CLASS, 'px-2 text-muted-foreground')}>
                {t.empty}
              </td>
            </tr>
          )}

          {draft ? (
            <DraftCategoryRow draft={draft} management={management} />
          ) : (
            <tr>
              <td colSpan={4} className="p-0">
                <button
                  type="button"
                  disabled={!management.canCreate || management.isLoading}
                  onClick={() => management.openDraft(type)}
                  className="flex h-8 w-full items-center gap-2 px-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <PlusIcon className="size-3.5" />
                  {type === 'income' ? t.newIncome : t.newExpense}
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function SkeletonRows() {
  return ['w-24', 'w-36', 'w-28', 'w-20'].map((width) => (
    <tr key={width} aria-hidden>
      <td className={cn(CELL_CLASS, 'px-2')}>
        <Skeleton className="mx-auto size-5" />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className={cn('h-3.5', width)} />
      </td>
      <td className={cn(CELL_CLASS, 'border-l px-2')}>
        <Skeleton className="h-3.5 w-16" />
      </td>
      <td className={CELL_CLASS} />
    </tr>
  ));
}

interface CategoryRowProps {
  category: Category;
  management: CategoryManagement;
}

function CategoryRow({ category, management }: CategoryRowProps) {
  const isRenaming = management.renamingId === category.id;

  return (
    <tr className="group hover:bg-muted/50">
      <td className={CELL_CLASS}>
        <IconPicker
          icon={category.icon}
          color={category.color}
          categoryName={category.name}
          onSelect={(iconName) => management.changeIcon(category, iconName)}
        />
      </td>

      <td
        className={cn(
          CELL_CLASS,
          'border-l',
          isRenaming && 'bg-card shadow-[inset_0_0_0_2px_var(--ring)]',
        )}
      >
        {isRenaming ? (
          <TextCellEditor
            label={t.columns.name}
            initialValue={category.name}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            onCommit={(text) => management.rename(category, text)}
            onCancel={management.cancelRenaming}
          />
        ) : (
          <button
            type="button"
            title={t.rename}
            onClick={() => management.startRenaming(category)}
            className="flex h-8 w-full items-center gap-2 px-2 text-left outline-none focus-visible:bg-muted"
          >
            <span className="truncate font-medium">{category.name}</span>
            {category.is_default && (
              <span className="shrink-0 rounded-sm bg-muted px-1 text-[0.7rem] text-muted-foreground">
                {t.defaultTag}
              </span>
            )}
          </button>
        )}
      </td>

      <td className={cn(CELL_CLASS, 'border-l')}>
        <ColorPicker
          color={category.color}
          categoryName={category.name}
          onSelect={(color) => management.changeColor(category, color)}
        />
      </td>

      <td className={CELL_CLASS}>
        <button
          type="button"
          aria-label={interpolate(t.deleteNamed, { name: category.name })}
          title={t.delete}
          onClick={() => management.requestDelete(category)}
          className={cn(
            ICON_BUTTON_CLASS,
            'mx-auto opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100',
          )}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

interface DraftCategoryRowProps {
  draft: CategoryDraft;
  management: CategoryManagement;
}

/** The row a new category is typed into: Enter saves, Escape discards. */
function DraftCategoryRow({ draft, management }: DraftCategoryRowProps) {
  return (
    <tr className="bg-card shadow-[inset_0_0_0_2px_var(--ring)]">
      <td className={CELL_CLASS}>
        <IconPicker
          icon={toIconValue(draft.icon)}
          color={draft.color}
          categoryName={draft.name}
          onSelect={(icon) => management.updateDraft({ icon })}
        />
      </td>
      <td className={cn(CELL_CLASS, 'border-l')}>
        <input
          autoFocus
          aria-label={t.namePlaceholder}
          placeholder={t.namePlaceholder}
          autoComplete="off"
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          value={draft.name}
          disabled={management.isSavingDraft}
          className="h-8 w-full bg-transparent px-2 font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
          onChange={(event) => management.updateDraft({ name: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') management.saveDraft();
            else if (event.key === 'Escape') management.discardDraft();
          }}
        />
      </td>
      <td className={cn(CELL_CLASS, 'border-l')}>
        <ColorPicker
          color={draft.color}
          categoryName={draft.name}
          onSelect={(color) => management.updateDraft({ color })}
        />
      </td>
      <td className={CELL_CLASS}>
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            aria-label={t.save}
            title={t.saveHint}
            disabled={management.isSavingDraft}
            onClick={management.saveDraft}
            className={cn(ICON_BUTTON_CLASS, 'hover:bg-primary-soft hover:text-foreground')}
          >
            <CheckIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={t.discard}
            title={t.discardHint}
            disabled={management.isSavingDraft}
            onClick={management.discardDraft}
            className={cn(ICON_BUTTON_CLASS, 'hover:bg-muted hover:text-foreground')}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function usageMessage(count: number | undefined, isUnknown: boolean): string {
  if (isUnknown) return t.usageUnknown;
  if (count === undefined) return t.usageChecking;
  if (count === 0) return t.usageNone;
  return count === 1 ? t.usageOne : interpolate(t.usageMany, { count });
}

function DeleteCategoryDialog({ management }: { management: CategoryManagement }) {
  const { deleting } = management;

  return (
    <AlertDialog
      open={!!deleting}
      onOpenChange={(open) => {
        if (!open && !management.isDeleting) management.cancelDelete();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {interpolate(t.deleteMessage, { name: deleting?.name ?? '' })}{' '}
            {usageMessage(management.deletingUsageCount, management.isUsageUnknown)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={management.isDeleting}>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            // Not before the dialog can say what goes with the category.
            disabled={
              management.isDeleting ||
              (management.deletingUsageCount === undefined && !management.isUsageUnknown)
            }
            onClick={(event) => {
              // Stay open until the database has answered.
              event.preventDefault();
              management.confirmDelete();
            }}
          >
            {management.isDeleting
              ? en.common.pleaseWait
              : management.deletingUsageCount
                ? t.deleteWithTransactions
                : t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
