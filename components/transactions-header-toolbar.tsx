import { Stack } from 'expo-router';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import type { CategoryFilterGroup, FilterType } from '@/hooks/use-transactions-screen';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

interface TransactionsHeaderToolbarProps {
  /** `Stack.Toolbar.*` items placed first, e.g. the Android month controls (`usePeriodNavToolbar`). */
  leadingItems?: ReactElement[];
  /** Show the `+` Add action in the header (iOS before the tab-bar action slot). */
  showAddAction: boolean;
  onAddPress: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
  /** One group per type; two (Expense, Income) when Type is All. */
  categoryGroups: CategoryFilterGroup[];
  isFilterActive: boolean;
}

/**
 * Right side of the Transactions header: any leading items (the Android month controls), the
 * filter menu (UIMenu on iOS, Material dropdown on Android) with an inline Type section and a
 * Category submenu, and the optional `+` Add action. A screen keeps only one `Stack.Toolbar` per
 * placement, so all of them live here. Items lay out left to right, so `+` comes last to take the
 * trailing (primary) spot.
 */
export function TransactionsHeaderToolbar({
  leadingItems = [],
  showAddAction,
  onAddPress,
  activeFilter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryGroups,
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

  const isGrouped = categoryGroups.length > 1;

  const renderCategoryActions = (group: CategoryFilterGroup) =>
    group.categories.map((category) => (
      <Stack.Toolbar.MenuAction
        key={category.id}
        isOn={categoryFilter === category.id}
        onPress={() => onCategoryFilterChange(category.id)}
      >
        {category.name}
      </Stack.Toolbar.MenuAction>
    ));

  // Android needs the menu icon as an image, so wait for it rather than show an empty slot.
  if (!filterIcon && !showAddAction && leadingItems.length === 0) return null;

  return (
    <Stack.Toolbar placement="right">
      {leadingItems}
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
          {/* Always a submenu, so the menu keeps the same shape whatever the Type filter or the
              category count. */}
          <Stack.Toolbar.Menu title={t(k.addTransaction.category)}>
            <Stack.Toolbar.MenuAction
              isOn={categoryFilter === null}
              onPress={() => onCategoryFilterChange(null)}
            >
              {t(k.transactions.allCategories)}
            </Stack.Toolbar.MenuAction>
            {isGrouped
              ? categoryGroups.map((group) => (
                  // iOS shows titled inline sections; Android's inline sections are only
                  // dividers with no title, so it gets a titled submenu per type instead.
                  <Stack.Toolbar.Menu
                    key={group.type}
                    inline={Platform.OS === 'ios'}
                    title={t(
                      group.type === 'expense' ? k.transactions.expense : k.transactions.income,
                    )}
                  >
                    {renderCategoryActions(group)}
                  </Stack.Toolbar.Menu>
                ))
              : categoryGroups.map(renderCategoryActions)}
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
