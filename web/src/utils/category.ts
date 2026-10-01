import type { Category, TransactionType } from '@/types/transaction';

/**
 * Categories matching a search, ordered for the picker: the preferred type's categories
 * first, then the rest, each alphabetically.
 */
export function filterCategories(
  categories: Category[],
  query: string,
  preferredType: TransactionType = 'expense',
): Category[] {
  const needle = query.trim().toLowerCase();
  return categories
    .filter((category) => !needle || category.name.toLowerCase().includes(needle))
    .sort((a, b) => {
      const rank = Number(a.type !== preferredType) - Number(b.type !== preferredType);
      return rank !== 0 ? rank : a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    });
}

/** Category colours are stored as `#RRGGBB`; mobile tints with a `20` alpha suffix. */
export function categoryTint(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}20` : 'transparent';
}

/** Same limit as the name field of mobile's category form. */
export const CATEGORY_NAME_MAX_LENGTH = 50;

/** The name as it is stored, or null when it is empty (mobile's only validation rule). */
export function normalizeCategoryName(input: string): string | null {
  const name = input.trim().slice(0, CATEGORY_NAME_MAX_LENGTH);
  return name || null;
}

/** `categories.icon` holds "Library/name"; mobile only ever writes Ionicons. */
export function toIconValue(name: string | null): string | null {
  return name ? `Ionicons/${name}` : null;
}

export interface CategoryGroup {
  type: TransactionType;
  categories: Category[];
}

/** Expense first, then income, as on mobile's categories screen; each in the given order. */
export function groupCategoriesByType(categories: Category[]): CategoryGroup[] {
  return (['expense', 'income'] as const).map((type) => ({
    type,
    categories: categories.filter((category) => category.type === type),
  }));
}
