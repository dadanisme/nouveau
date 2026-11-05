import type { TransactionWithCategory } from '@/hooks/use-transactions';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { computeCategoryBreakdown, type CategorySpend } from '@/utils/analytics';
import { formatCompactAmount, formatCurrency } from '@/utils/currency';
import {
  formatMonthName,
  formatPeriodLabel,
  shiftPeriod,
  type Period,
  type PeriodMode,
} from '@/utils/date';

/** The period's main message, stated before the details (HIG charts#Descriptive-content). */
export interface InsightsSummary {
  /** "You spent Rp4.2M, 12% less than October". */
  headline: string;
  /** "Food was your top category; Transport rose the most (+Rp300K)". Absent with no spending. */
  detail?: string;
  /** The headline with full amounts, for VoiceOver / TalkBack. */
  spokenHeadline: string;
  /** The detail with full amounts. */
  spokenDetail?: string;
}

export interface InsightsSummaryInput {
  mode: PeriodMode;
  /** The period shown: a month, or a year in year mode. */
  period: Period;
  /** The period's transactions. */
  current: TransactionWithCategory[] | undefined;
  /** The previous month's (or year's) transactions; undefined while unknown. */
  previous: TransactionWithCategory[] | undefined;
}

/** A category's change in spending against the previous period. */
interface CategoryChange {
  id: string;
  name: string;
  /** This period's amount minus the previous period's. */
  delta: number;
}

/** Amounts are whole rupiah: a smaller difference (floating-point sums) is no change. */
function isZero(amount: number): boolean {
  return Math.round(Math.abs(amount)) === 0;
}

function total(spends: CategorySpend[]): number {
  return spends.reduce((sum, spend) => sum + spend.amount, 0);
}

/**
 * The expense category whose spending changed the most in absolute terms (a rise or a fall,
 * including a category spent on in only one of the periods). Undefined when nothing changed.
 */
function findBiggestChange(
  current: CategorySpend[],
  previous: CategorySpend[],
): CategoryChange | undefined {
  const changes = new Map<string, CategoryChange>();
  for (const spend of previous) {
    if (spend.id) changes.set(spend.id, { id: spend.id, name: spend.name, delta: -spend.amount });
  }
  for (const spend of current) {
    if (!spend.id) continue;
    const change = changes.get(spend.id);
    if (change) {
      change.delta += spend.amount;
      change.name = spend.name;
    } else {
      changes.set(spend.id, { id: spend.id, name: spend.name, delta: spend.amount });
    }
  }

  let biggest: CategoryChange | undefined;
  for (const change of changes.values()) {
    if (isZero(change.delta)) continue;
    if (!biggest || Math.abs(change.delta) > Math.abs(biggest.delta)) biggest = change;
  }
  return biggest;
}

/**
 * The Insights headline and its second line for a month (compared with the previous month) or a
 * year (compared with the previous year). The comparison and the biggest change are left out when
 * the previous period has no spending. With nothing spent, the headline says so and there's no
 * second line. `locale` pins the strings to the in-app language (pass it where memoized).
 */
export function buildInsightsSummary(
  { mode, period, current, previous }: InsightsSummaryInput,
  locale?: string,
): InsightsSummary {
  const options = locale ? { locale } : undefined;
  const t = (key: string, values: Record<string, string> = {}) =>
    i18n.t(key, { ...options, ...values });

  const yearLabel = (year: number) => t(k.insights.headline.yearLabel, { year: String(year) });

  const spending = computeCategoryBreakdown(current, 'expense');
  const spent = total(spending);

  if (isZero(spent)) {
    const periodName =
      mode === 'year'
        ? yearLabel(period.year)
        : formatPeriodLabel('month', period.year, period.month, { locale });
    const headline = t(k.insights.headline.noSpending, { period: periodName });
    return { headline, spokenHeadline: headline };
  }

  const previousPeriod = shiftPeriod(mode, period, -1);
  const previousName =
    mode === 'year'
      ? yearLabel(previousPeriod.year)
      : formatMonthName(previousPeriod.month, locale);
  const previousSpending = computeCategoryBreakdown(previous, 'expense');
  const previousSpent = total(previousSpending);
  const hasComparison = !isZero(previousSpent);

  const top = spending[0];
  const change = hasComparison ? findBiggestChange(spending, previousSpending) : undefined;

  /** Both lines with amounts in `format`: compact on screen, full for screen readers. */
  function compose(format: (value: number) => string): [string, string] {
    const amount = format(spent);
    let headline: string;
    if (!hasComparison) {
      headline = t(k.insights.headline.spent, { amount });
    } else if (isZero(spent - previousSpent)) {
      headline = t(k.insights.headline.spentSame, { amount, period: previousName });
    } else {
      const ratio = ((spent - previousSpent) / previousSpent) * 100;
      const percent = Math.round(Math.abs(ratio));
      const key =
        percent === 0
          ? k.insights.headline.spentAboutSame
          : ratio < 0
            ? k.insights.headline.spentLess
            : k.insights.headline.spentMore;
      headline = t(key, { amount, percent: `${percent}%`, period: previousName });
    }

    let detail: string;
    if (!change) {
      detail = t(k.insights.headline.topCategory, { name: top.name });
    } else {
      const delta = `${change.delta > 0 ? '+' : '−'}${format(Math.abs(change.delta))}`;
      const rose = change.delta > 0;
      if (change.id === top.id) {
        detail = t(rose ? k.insights.headline.topAndRose : k.insights.headline.topAndFell, {
          name: top.name,
          amount: delta,
        });
      } else {
        detail = t(k.insights.headline.detail, {
          top: t(k.insights.headline.topCategory, { name: top.name }),
          change: t(rose ? k.insights.headline.rose : k.insights.headline.fell, {
            name: change.name,
            amount: delta,
          }),
        });
      }
    }
    return [headline, detail];
  }

  const [headline, detail] = compose((value) => formatCompactAmount(value, locale));
  const spoken = compose(formatCurrency);
  return { headline, detail, spokenHeadline: spoken[0], spokenDetail: spoken[1] };
}
