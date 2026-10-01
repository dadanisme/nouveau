import { describe, expect, it } from 'vitest';

import { CATEGORY_COLORS } from '@/lib/category-colors';
import { CATEGORY_ICON_GROUPS } from '@/lib/category-icon-groups';
import { getCategoryIconSvg } from '@/lib/category-icons';
import type { Category } from '@/types/transaction';
import {
  CATEGORY_NAME_MAX_LENGTH,
  categoryTint,
  groupCategoriesByType,
  normalizeCategoryName,
  toIconValue,
} from '@/utils/category';

function category(id: string, type: string): Category {
  return {
    id,
    name: id,
    type,
    color: '#EF4444',
    icon: null,
    is_default: false,
    created_at: null,
    updated_at: null,
    user_id: 'user-1',
    workspace_id: 'ws-1',
  };
}

describe('normalizeCategoryName', () => {
  it('trims, and rejects an empty name', () => {
    expect(normalizeCategoryName('  Groceries ')).toBe('Groceries');
    expect(normalizeCategoryName('   ')).toBeNull();
    expect(normalizeCategoryName('')).toBeNull();
  });

  it('caps the length like the mobile form', () => {
    expect(normalizeCategoryName('x'.repeat(80))).toHaveLength(CATEGORY_NAME_MAX_LENGTH);
  });
});

describe('toIconValue', () => {
  it('stores icons the way mobile does', () => {
    expect(toIconValue('fast-food')).toBe('Ionicons/fast-food');
    expect(toIconValue(null)).toBeNull();
  });
});

describe('groupCategoriesByType', () => {
  it('puts expense before income and keeps the order within a group', () => {
    const groups = groupCategoriesByType([
      category('salary', 'income'),
      category('food', 'expense'),
      category('transport', 'expense'),
    ]);
    expect(groups.map((group) => [group.type, group.categories.map((c) => c.id)])).toEqual([
      ['expense', ['food', 'transport']],
      ['income', ['salary']],
    ]);
  });
});

describe('category pickers', () => {
  it('can draw every icon the picker offers', () => {
    const missing = CATEGORY_ICON_GROUPS.flatMap((group) => group.icons).filter(
      (name) => !getCategoryIconSvg(toIconValue(name)),
    );
    expect(missing).toEqual([]);
  });

  it('offers colours the tint helper understands', () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThan(0);
    for (const color of CATEGORY_COLORS) expect(categoryTint(color)).toBe(`${color}20`);
  });
});
