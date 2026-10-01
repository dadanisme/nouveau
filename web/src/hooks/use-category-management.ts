import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useWorkspace } from '@/contexts/workspace-context';
import { useSession } from '@/hooks/use-auth';
import { useCategories } from '@/hooks/use-categories';
import {
  useAddCategory,
  useCategoryUsage,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-category-mutations';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { en } from '@/locales/en';
import type { Category, TransactionType } from '@/types/transaction';
import { groupCategoriesByType, normalizeCategoryName, toIconValue } from '@/utils/category';

const t = en.categories;

const NO_CATEGORIES: Category[] = [];

/** A category being created. `icon` is the bare Ionicons name, as in mobile's form. */
export interface CategoryDraft {
  type: TransactionType;
  name: string;
  icon: string | null;
  color: string;
}

function showError(title: string) {
  return (error: unknown) => {
    toast.error(title, {
      description: error instanceof Error ? error.message : en.common.unexpectedError,
    });
  };
}

/**
 * State and actions of the categories page. Same rules as mobile's category screen: a name is
 * required (trimmed, 50 characters), new categories start with the first palette colour and no
 * icon, belong to the active workspace, and every category (default or not) can be edited or
 * deleted. Deleting is the same plain DELETE as mobile; the database cascades it to the
 * category's transactions, so the dialog counts them first and says so.
 */
export function useCategoryManagement() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { currentWorkspaceId, isLoading: isWorkspaceLoading } = useWorkspace();

  const categoriesQuery = useCategories(currentWorkspaceId);
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const usage = useCategoryUsage(currentWorkspaceId, deleting?.id);

  const categories = categoriesQuery.data ?? NO_CATEGORIES;
  const groups = useMemo(() => groupCategoriesByType(categories), [categories]);

  const update = (
    category: Category,
    changes: Partial<Pick<Category, 'name' | 'icon' | 'color'>>,
  ) =>
    updateCategory.mutate({ id: category.id, ...changes }, { onError: showError(t.updateFailed) });

  const rename = (category: Category, text: string) => {
    setRenamingId(null);
    const name = normalizeCategoryName(text);
    if (!name) {
      toast.error(t.invalidName, { description: t.invalidNameMessage });
      return;
    }
    if (name !== category.name) update(category, { name });
  };

  const changeIcon = (category: Category, iconName: string) => {
    const icon = toIconValue(iconName);
    if (icon !== category.icon) update(category, { icon });
  };

  const changeColor = (category: Category, color: string) => {
    if (color !== category.color) update(category, { color });
  };

  const saveDraft = () => {
    if (!draft || addCategory.isPending) return;
    const name = normalizeCategoryName(draft.name);
    if (!name) {
      toast.error(t.invalidName, { description: t.invalidNameMessage });
      return;
    }
    if (!userId || !currentWorkspaceId) return;
    addCategory.mutate(
      {
        name,
        type: draft.type,
        color: draft.color,
        icon: toIconValue(draft.icon),
        user_id: userId,
        workspace_id: currentWorkspaceId,
      },
      { onSuccess: () => setDraft(null), onError: showError(t.saveFailed) },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteCategory.mutate(
      { id: deleting.id },
      {
        onSuccess: () => {
          toast(t.deleted);
          setDeleting(null);
        },
        onError: (error) => {
          setDeleting(null);
          toast.error(t.deleteFailed, {
            description: error instanceof Error ? error.message : t.deleteFailedInUse,
          });
        },
      },
    );
  };

  return {
    groups,
    isLoading: isWorkspaceLoading || (!!currentWorkspaceId && categoriesQuery.isPending),
    error: categoriesQuery.error,
    retry: () => void categoriesQuery.refetch(),
    canCreate: !!userId && !!currentWorkspaceId,

    renamingId,
    startRenaming: (category: Category) => setRenamingId(category.id),
    cancelRenaming: () => setRenamingId(null),
    rename,
    changeIcon,
    changeColor,

    draft,
    openDraft: (type: TransactionType) =>
      setDraft({ type, name: '', icon: null, color: CATEGORY_COLORS[0] }),
    updateDraft: (changes: Partial<Omit<CategoryDraft, 'type'>>) =>
      setDraft((current) => (current ? { ...current, ...changes } : current)),
    saveDraft,
    discardDraft: () => setDraft(null),
    isSavingDraft: addCategory.isPending,

    deleting,
    /** Transactions using the category about to be deleted; undefined while it is counted. */
    deletingUsageCount: usage.data,
    /** The count could not be fetched: the dialog warns instead of guessing. */
    isUsageUnknown: usage.isError,
    isDeleting: deleteCategory.isPending,
    requestDelete: setDeleting,
    confirmDelete,
    cancelDelete: () => setDeleting(null),
  };
}

export type CategoryManagement = ReturnType<typeof useCategoryManagement>;
