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
