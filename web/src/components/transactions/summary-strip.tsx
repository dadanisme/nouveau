import { ChevronDownIcon } from 'lucide-react';

import { CategoryIcon } from '@/components/transactions/category-label';
import { Skeleton } from '@/components/ui/skeleton';
import type { SummaryStripState } from '@/hooks/use-summary-strip';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import type { TransactionType } from '@/types/transaction';
import { formatAmount, formatBalance } from '@/utils/currency';
import { type CategorySpend, formatPercentage } from '@/utils/summary';
import { interpolate } from '@/utils/string';

const t = en.summary;

const BREAKDOWN_ID = 'summary-breakdown';

const BREAKDOWN_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: en.transactions.expense },
  { value: 'income', label: en.transactions.income },
];

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
          className="block h-full rounded-full"
          style={{ width: `${entry.ratio * 100}%`, backgroundColor: entry.color }}
        />
      </span>
    </button>
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
 * per-category breakdown whose rows filter the table.
 */
export function SummaryStrip({ state, currency, isLoading }: SummaryStripProps) {
  const { summary, breakdown } = state;
  const isReady = !isLoading && currency !== null;

  return (
    <section aria-label={t.label} className="shrink-0 border-t px-6">
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
          <div className="flex items-center gap-2 pb-1">
            <div
              role="group"
              aria-label={t.breakdownType}
              className="flex h-6 rounded-md border p-0.5"
            >
              {BREAKDOWN_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={state.breakdownType === option.value}
                  disabled={!state.canChangeBreakdownType}
                  onClick={() => state.setBreakdownType(option.value)}
                  className={cn(
                    'rounded-sm px-2 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                    state.breakdownType === option.value
                      ? 'bg-primary-soft text-foreground'
                      : 'enabled:hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t.breakdownHint}</p>
          </div>

          {!isReady ? (
            <Skeleton className="h-10 w-full" />
          ) : breakdown.length === 0 ? (
            <p className="px-2 py-2 text-muted-foreground">
              {state.breakdownType === 'income' ? t.noIncome : t.noExpense}
            </p>
          ) : (
            <div className="-mx-2 grid max-h-44 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-x-4 gap-y-0.5 overflow-y-auto">
              {breakdown.map((entry) => (
                <BreakdownRow
                  key={entry.id}
                  entry={entry}
                  currency={currency}
                  isSelected={entry.id === state.selectedCategoryId}
                  onToggle={() => state.toggleCategory(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
