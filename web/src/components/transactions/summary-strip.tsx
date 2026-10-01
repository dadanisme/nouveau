import { ChevronDownIcon } from 'lucide-react';

import { CategoryIcon } from '@/components/transactions/category-label';
import { Skeleton } from '@/components/ui/skeleton';
import type { SummaryStripState } from '@/hooks/use-summary-strip';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import { formatAmount, formatBalance } from '@/utils/currency';
import { type BreakdownGroup, type CategorySpend, formatPercentage } from '@/utils/summary';
import { interpolate } from '@/utils/string';

const t = en.summary;

const BREAKDOWN_ID = 'summary-breakdown';

const EMPTY_MESSAGES = { all: t.noTransactions, expense: t.noExpense, income: t.noIncome };

interface TotalProps {
  label: string;
  value: string | null;
  className?: string;
}

function Total({ label, value, className }: TotalProps) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('font-semibold tabular-nums', className)}>
        {value ?? <Skeleton className="inline-block h-3.5 w-20 align-middle" />}
      </dd>
    </div>
  );
}

interface BreakdownRowProps {
  entry: CategorySpend;
  currency: string;
  isSelected: boolean;
  onToggle: () => void;
}

function BreakdownRow({ entry, currency, isSelected, onToggle }: BreakdownRowProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      title={interpolate(isSelected ? t.clearFilter : t.filterBy, { name: entry.name })}
      onClick={onToggle}
      className={cn(
        'flex flex-col gap-1 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-primary-soft hover:bg-primary-soft',
      )}
    >
      <span className="flex w-full items-center gap-2">
        <CategoryIcon icon={entry.icon} color={entry.color} />
        <span className="min-w-0 flex-1 truncate">{entry.name}</span>
        <span className="font-medium tabular-nums">{formatAmount(entry.amount, currency)}</span>
        <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
          {formatPercentage(entry.percentage)}
        </span>
      </span>
      <span aria-hidden className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <span
          className="category-ink block h-full rounded-full bg-(--category-ink)"
          style={
            {
              width: `${entry.ratio * 100}%`,
              '--category-color': entry.color,
            } as React.CSSProperties
          }
        />
      </span>
    </button>
  );
}

interface BreakdownGroupListProps {
  group: BreakdownGroup;
  currency: string;
  selectedCategoryId: string | null;
  onToggleCategory: (categoryId: string) => void;
}

/** One type's categories under its own heading; shares are of that type's total. */
function BreakdownGroupList({
  group,
  currency,
  selectedCategoryId,
  onToggleCategory,
}: BreakdownGroupListProps) {
  const isIncome = group.type === 'income';
  const headingId = `${BREAKDOWN_ID}-${group.type}`;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h3 id={headingId} className="flex items-baseline gap-2 pb-0.5 text-xs">
        <span className="font-medium">{isIncome ? t.income : t.expense}</span>
        <span className={cn('tabular-nums', isIncome ? 'text-income' : 'text-expense')}>
          {formatAmount(group.total, currency)}
        </span>
      </h3>
      <div className="-mx-2 grid max-h-44 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-x-4 gap-y-0.5 overflow-y-auto">
        {group.categories.map((entry) => (
          <BreakdownRow
            key={entry.id}
            entry={entry}
            currency={currency}
            isSelected={entry.id === selectedCategoryId}
            onToggle={() => onToggleCategory(entry.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface SummaryStripProps {
  state: SummaryStripState;
  /** The workspace's home currency; null while it is loading. */
  currency: string | null;
  isLoading: boolean;
}

/**
 * Income, expense and net of the rows in the table, in the home currency, with a collapsible
 * per-category breakdown whose rows filter the table. The breakdown has no type switch of its
 * own: it shows the types the toolbar's type filter lets through.
 */
export function SummaryStrip({ state, currency, isLoading }: SummaryStripProps) {
  const { summary, breakdownGroups } = state;
  const isReady = !isLoading && currency !== null;

  return (
    <section aria-label={t.label} className="page-container shrink-0 border-t">
      <div className="flex h-10 items-center gap-6">
        <dl className="flex min-w-0 flex-wrap items-baseline gap-x-6">
          <Total
            label={t.income}
            value={isReady ? formatAmount(summary.income, currency) : null}
            className="text-income"
          />
          <Total
            label={t.expense}
            value={isReady ? formatAmount(summary.expense, currency) : null}
            className="text-expense"
          />
          <Total label={t.net} value={isReady ? formatBalance(summary.net, currency) : null} />
        </dl>

        <button
          type="button"
          aria-expanded={state.isBreakdownOpen}
          aria-controls={BREAKDOWN_ID}
          onClick={state.toggleBreakdown}
          className="ml-auto flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[0.8rem] font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.breakdown}
          <ChevronDownIcon
            className={cn('size-3.5 transition-transform', state.isBreakdownOpen && 'rotate-180')}
          />
        </button>
      </div>

      {state.isBreakdownOpen && (
        <div id={BREAKDOWN_ID} className="pb-3">
          <p className="pb-1.5 text-xs text-muted-foreground">{t.breakdownHint}</p>

          {!isReady ? (
            <Skeleton className="h-10 w-full" />
          ) : breakdownGroups.length === 0 ? (
            <p className="py-2 text-muted-foreground">{EMPTY_MESSAGES[state.typeFilter]}</p>
          ) : (
            <div className={cn('grid gap-x-10', breakdownGroups.length > 1 && 'grid-cols-2')}>
              {breakdownGroups.map((group) => (
                <BreakdownGroupList
                  key={group.type}
                  group={group}
                  currency={currency}
                  selectedCategoryId={state.selectedCategoryId}
                  onToggleCategory={state.toggleCategory}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
