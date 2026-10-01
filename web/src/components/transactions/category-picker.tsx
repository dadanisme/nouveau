import { CheckIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { CategoryLabel } from '@/components/transactions/category-label';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategoryCombobox } from '@/hooks/use-category-combobox';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category, TransactionType } from '@/types/transaction';

const t = en.transactions;

interface CategoryOptionsProps {
  options: Category[];
  activeId: string | null;
  selectedId: string | null;
  onHighlight: (id: string) => void;
  onChoose: (category: Category) => void;
}

function CategoryOptions({
  options,
  activeId,
  selectedId,
  onHighlight,
  onChoose,
}: CategoryOptionsProps) {
  if (options.length === 0) {
    return <p className="px-2 py-4 text-center text-muted-foreground">{t.noCategories}</p>;
  }

  return (
    <div role="listbox" className="max-h-64 overflow-y-auto">
      {options.map((category, index) => {
        const isActive = category.id === activeId;
        const startsGroup = index === 0 || options[index - 1].type !== category.type;
        return (
          <div key={category.id}>
            {startsGroup && (
              <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                {category.type === 'income' ? t.income : t.expense}
              </p>
            )}
            <div
              role="option"
              aria-selected={category.id === selectedId}
              ref={
                isActive ? (element) => element?.scrollIntoView({ block: 'nearest' }) : undefined
              }
              className={cn(
                'flex h-8 cursor-default items-center gap-2 rounded-sm px-2',
                isActive && 'bg-muted',
              )}
              onMouseMove={() => {
                if (!isActive) onHighlight(category.id);
              }}
              onClick={() => onChoose(category)}
            >
              <CategoryLabel category={category} className="flex-1" />
              {category.id === selectedId && <CheckIcon className="size-4 text-primary-strong" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CategoryComboboxProps {
  categories: Category[];
  selectedId: string | null;
  preferredType?: TransactionType;
  onSelect: (category: Category) => void;
  /** An option was chosen with the mouse (after `onSelect`). */
  onOptionClick?: () => void;
  /** Keys the combobox did not consume (see `useCategoryCombobox`). */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  invalid?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Category combobox that lives inside a table cell: the cell is the search input and the
 * options open below it. Focus never leaves the input, so Tab keeps moving along the row.
 */
export function CategoryCombobox({
  categories,
  selectedId,
  preferredType,
  onSelect,
  onOptionClick,
  onKeyDown,
  onBlur,
  autoFocus,
  invalid,
  inputRef,
}: CategoryComboboxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const combobox = useCategoryCombobox({ categories, selectedId, preferredType, onSelect });
  const selected = categories.find((category) => category.id === selectedId);

  return (
    <Popover open={isFocused}>
      <PopoverAnchor asChild>
        <div className="relative h-8">
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={isFocused}
            aria-label={t.category}
            aria-invalid={invalid || undefined}
            autoFocus={autoFocus}
            autoComplete="off"
            value={combobox.query}
            placeholder={selected ? undefined : t.categoryPlaceholder}
            className="size-full bg-transparent px-2 outline-none placeholder:text-muted-foreground"
            onChange={(event) => combobox.setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              combobox.reset();
              onBlur?.();
            }}
            onKeyDown={(event) => {
              if (!combobox.handleKeyDown(event)) onKeyDown?.(event);
            }}
          />
          {selected && !combobox.query && (
            <CategoryLabel
              category={selected}
              className="pointer-events-none absolute inset-0 px-2"
            />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={2}
        className="w-64 gap-0 p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Keep focus in the input while the list is clicked or scrolled.
        onMouseDown={(event) => event.preventDefault()}
      >
        <CategoryOptions
          options={combobox.options}
          activeId={combobox.activeId}
          selectedId={selectedId}
          onHighlight={combobox.highlight}
          onChoose={(category) => {
            combobox.choose(category);
            onOptionClick?.();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface CategoryMenuProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
  /** The button that opens the menu. */
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
}

/** Category picker behind a button, with its own search box (toolbar filter, bulk bar). */
export function CategoryMenu({
  categories,
  selectedId,
  onSelect,
  children,
  align = 'start',
  side = 'bottom',
}: CategoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const combobox = useCategoryCombobox({
    categories,
    selectedId,
    onSelect: (category) => {
      onSelect(category);
      setIsOpen(false);
    },
  });

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) combobox.reset();
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-64 gap-0 p-1">
        <div className="flex h-8 items-center gap-2 border-b px-2">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            role="combobox"
            aria-expanded
            aria-label={t.searchCategories}
            placeholder={t.searchCategories}
            autoComplete="off"
            value={combobox.query}
            className="size-full bg-transparent outline-none placeholder:text-muted-foreground"
            onChange={(event) => combobox.setQuery(event.target.value)}
            onKeyDown={combobox.handleKeyDown}
          />
        </div>
        <CategoryOptions
          options={combobox.options}
          activeId={combobox.activeId}
          selectedId={selectedId}
          onHighlight={combobox.highlight}
          onChoose={combobox.choose}
        />
      </PopoverContent>
    </Popover>
  );
}
