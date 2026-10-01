import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { DateRange as PickerRange } from 'react-day-picker';

import { CategoryLabel } from '@/components/transactions/category-label';
import { CategoryMenu } from '@/components/transactions/category-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { Category, DateRange, TypeFilter } from '@/types/transaction';
import {
  normalizeRange,
  parseDateKey,
  startOfPreviousMonth,
  toLocalDateString,
} from '@/utils/date';

const t = en.transactions;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: t.allTypes },
  { value: 'income', label: t.income },
  { value: 'expense', label: t.expense },
];

interface TransactionsToolbarProps {
  periodLabel: string;
  isCurrentMonth: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  visibleRange: DateRange;
  customRange: DateRange | null;
  onCustomRangeChange: (range: DateRange | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (type: TypeFilter) => void;
  categories: Category[];
  categoryFilter: string | null;
  onCategoryFilterChange: (categoryId: string | null) => void;
  canCreate: boolean;
  onNew: () => void;
}

interface DateRangeFilterProps {
  visibleRange: DateRange;
  customRange: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

/** Picks a custom period. It applies once both ends are chosen, and overrides the month. */
function DateRangeFilter({ visibleRange, customRange, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<PickerRange | undefined>(undefined);

  const apply = () => {
    if (!picked?.from) return;
    onChange(
      normalizeRange(toLocalDateString(picked.from), toLocalDateString(picked.to ?? picked.from)),
    );
    setIsOpen(false);
  };

  return (
    <div className="flex items-center">
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          // Start from the range in effect each time the picker opens.
          if (open) {
            setPicked(
              customRange
                ? {
                    from: parseDateKey(customRange.from) ?? undefined,
                    to: parseDateKey(customRange.to) ?? undefined,
                  }
                : undefined,
            );
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(customRange && 'rounded-r-none border-primary bg-primary-soft')}
          >
            <CalendarIcon />
            {t.dateRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto gap-0 p-0">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={picked}
            onSelect={setPicked}
            // Two months ending on the period shown: previous month on the left, current
            // on the right.
            defaultMonth={startOfPreviousMonth(visibleRange.to) ?? undefined}
          />
          <div className="flex justify-end gap-2 border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              {t.cancel}
            </Button>
            <Button size="sm" disabled={!picked?.from} onClick={apply}>
              {t.applyDateRange}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {customRange && (
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t.clearDateRange}
          title={t.clearDateRange}
          className="rounded-l-none border-l-0 border-primary bg-primary-soft"
          onClick={() => onChange(null)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

export function TransactionsToolbar({
  periodLabel,
  isCurrentMonth,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  visibleRange,
  customRange,
  onCustomRangeChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  canCreate,
  onNew,
}: TransactionsToolbarProps) {
  const filteredCategory = categories.find((category) => category.id === categoryFilter);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.previousMonth}
          title={t.previousMonth}
          onClick={onPreviousMonth}
        >
          <ChevronLeftIcon />
        </Button>
        <p aria-live="polite" className="min-w-36 text-center font-semibold tabular-nums">
          {periodLabel}
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.nextMonth}
          title={t.nextMonth}
          onClick={onNextMonth}
        >
          <ChevronRightIcon />
        </Button>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" onClick={onCurrentMonth}>
            {t.thisMonth}
          </Button>
        )}
      </div>

      <DateRangeFilter
        visibleRange={visibleRange}
        customRange={customRange}
        onChange={onCustomRangeChange}
      />

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={t.searchPlaceholder}
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onSearchChange('');
          }}
          className="h-7 w-52 pl-7"
        />
      </div>

      <div role="group" aria-label={t.typeFilter} className="flex h-7 rounded-lg border p-0.5">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={typeFilter === option.value}
            onClick={() => onTypeFilterChange(option.value)}
            className={cn(
              'rounded-md px-2 text-[0.8rem] font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
              typeFilter === option.value
                ? 'bg-primary-soft text-foreground'
                : 'hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center">
        <CategoryMenu
          categories={categories}
          selectedId={categoryFilter}
          onSelect={(category) => onCategoryFilterChange(category.id)}
        >
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'max-w-52',
              filteredCategory && 'rounded-r-none border-primary bg-primary-soft',
            )}
          >
            {filteredCategory ? (
              <CategoryLabel category={filteredCategory} />
            ) : (
              <>
                <TagIcon />
                {t.category}
              </>
            )}
          </Button>
        </CategoryMenu>
        {filteredCategory && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t.clearCategoryFilter}
            title={t.clearCategoryFilter}
            className="rounded-l-none border-l-0 border-primary bg-primary-soft"
            onClick={() => onCategoryFilterChange(null)}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <Button size="sm" className="ml-auto" title={t.newHint} disabled={!canCreate} onClick={onNew}>
        <PlusIcon />
        {t.new}
      </Button>
    </div>
  );
}
