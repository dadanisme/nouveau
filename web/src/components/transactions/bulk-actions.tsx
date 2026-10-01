import { TagIcon, Trash2Icon, XIcon } from 'lucide-react';

import { CategoryMenu } from '@/components/transactions/category-picker';
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
import { en } from '@/locales/en';
import type { Category } from '@/types/transaction';
import { interpolate } from '@/utils/string';

const t = en.transactions;

interface BulkActionsBarProps {
  count: number;
  categories: Category[];
  onChangeCategory: (category: Category) => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Floats over the bottom of the table while rows are selected. */
export function BulkActionsBar({
  count,
  categories,
  onChangeCategory,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={interpolate(t.selected, { count })}
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover p-1 pl-3 shadow-md"
    >
      <span className="pr-2 font-medium tabular-nums">{interpolate(t.selected, { count })}</span>
      <CategoryMenu
        categories={categories}
        selectedId={null}
        onSelect={onChangeCategory}
        side="top"
        align="center"
      >
        <Button variant="ghost" size="sm">
          <TagIcon />
          {t.changeCategory}
        </Button>
      </CategoryMenu>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
        <Trash2Icon />
        {t.delete}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t.clearSelection}
        title={t.clearSelection}
        onClick={onClear}
      >
        <XIcon />
      </Button>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  /** Number of rows waiting for confirmation; 0 keeps the dialog closed. */
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ count, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog
      open={count > 0}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{interpolate(t.confirmDeleteTitle, { count })}</AlertDialogTitle>
          <AlertDialogDescription>{t.confirmDeleteMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {interpolate(t.confirmDeleteAction, { count })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
