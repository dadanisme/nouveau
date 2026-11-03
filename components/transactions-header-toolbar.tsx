import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import type { FilterType } from '@/hooks/use-transactions-screen';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';

/** Above this many categories, the Category section becomes a submenu instead of inline rows. */
const CATEGORY_INLINE_LIMIT = 6;

interface TransactionsHeaderToolbarProps {
  /** Show the `+` Add action in the header (iOS before the tab-bar action slot). */
  showAddAction: boolean;
  onAddPress: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
  categories: Tables<'categories'>[];
  isFilterActive: boolean;
}

/**
 * Right side of the Transactions header: the optional `+` Add action and the filter menu (UIMenu
 * on iOS, Material dropdown on Android) with Type and Category sections. A screen keeps only one
 * `Stack.Toolbar` per placement, so both items live here. Items lay out left to right, so `+`
 * comes last to take the trailing (primary) spot.
 */
export function TransactionsHeaderToolbar({
  showAddAction,
  onAddPress,
  activeFilter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  isFilterActive,
}: TransactionsHeaderToolbarProps) {
  const { t } = useLanguage();
  // iOS swaps to the filled symbol while a filter is on; Android adds a badge dot instead.
  const filterIcon = useSymbolIcon({
    sf: isFilterActive
      ? 'line.3.horizontal.decrease.circle.fill'
      : 'line.3.horizontal.decrease.circle',
    md: 'filter_list',
  });

  const typeOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: t(k.transactions.all) },
    { key: 'expense', label: t(k.transactions.expense) },
    { key: 'income', label: t(k.transactions.income) },
  ];

  // Android needs the menu icon as an image, so wait for it rather than show an empty slot.
  if (!filterIcon && !showAddAction) return null;

  return (
    <Stack.Toolbar placement="right">
      {filterIcon && (
        <Stack.Toolbar.Menu
          icon={filterIcon}
          accessibilityLabel={
            isFilterActive ? t(k.transactions.filterActive) : t(k.transactions.filter)
          }
        >
          {Platform.OS === 'android' && isFilterActive && <Stack.Toolbar.Badge />}
          <Stack.Toolbar.Menu inline title={t(k.transactions.type)}>
            {typeOptions.map((option) => (
              <Stack.Toolbar.MenuAction
                key={option.key}
                isOn={activeFilter === option.key}
                onPress={() => onFilterChange(option.key)}
              >
                {option.label}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.Menu
            inline={categories.length <= CATEGORY_INLINE_LIMIT}
            title={t(k.addTransaction.category)}
          >
            <Stack.Toolbar.MenuAction
              isOn={categoryFilter === null}
              onPress={() => onCategoryFilterChange(null)}
            >
              {t(k.transactions.allCategories)}
            </Stack.Toolbar.MenuAction>
            {categories.map((category) => (
              <Stack.Toolbar.MenuAction
                key={category.id}
                isOn={categoryFilter === category.id}
                onPress={() => onCategoryFilterChange(category.id)}
              >
                {category.name}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      )}
      {showAddAction && (
        <Stack.Toolbar.Button
          icon="plus"
          accessibilityLabel={t(k.addTransaction.addTransaction)}
          onPress={onAddPress}
        />
      )}
    </Stack.Toolbar>
  );
}
