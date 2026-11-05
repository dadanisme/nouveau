import type { ColorValue } from 'react-native';

import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import type { CategorySpend } from '@/utils/analytics';
import { getCategoryColor } from '@/utils/category-color';
import { formatCompactAmount, formatCurrency } from '@/utils/currency';

/** One segment of the category bar: a category, or the remaining ones together ("Others"). */
export interface CategoryBarSegment {
  /** The category id, or "others". */
  id: string;
  /** The legend name. */
  name: string;
  /** The segment's expense total; the bar sizes segments by it. */
  value: number;
  /** The share of the period's spending as a whole percent ("34%", "<1%"). */
  shareLabel: string;
  /** The category's display color ("Others" takes the system gray). */
  color: ColorValue;
}

export interface CategoryBarModel {
  segments: CategoryBarSegment[];
  /** The period's total expenses, compact ("Rp4.2M spent"). */
  headline: string;
  /** One label for VoiceOver / TalkBack: the full total, then each segment's share. */
  accessibilityLabel: string;
  /** What tapping the bar does ("Opens Insights for this month."). */
  accessibilityHint: string;
}

/** A share as a whole percent; a share that rounds to zero still shows as "<1%". */
export function formatSharePercent(percentage: number): string {
  if (percentage > 0 && percentage < 0.5) return '<1%';
  return `${Math.round(percentage)}%`;
}

/**
 * The category bar for an expense breakdown (`computeExpenseBreakdown`): one segment per entry,
 * the compact headline and a summary with the full total for screen readers. Null when there's
 * nothing spent, so the bar is hidden. `locale` pins the strings to the in-app language and
 * `othersTitle` names the "Others" bucket in it (both memoized by callers).
 */
export function toCategoryBarModel(
  spends: CategorySpend[],
  { locale, othersTitle }: { locale?: string; othersTitle?: string } = {},
): CategoryBarModel | null {
  const total = spends.reduce((sum, spend) => sum + spend.amount, 0);
  if (total <= 0) return null;

  const options = locale ? { locale } : undefined;
  const segments = spends.map(
    (spend): CategoryBarSegment => ({
      id: spend.id ?? 'others',
      name: spend.id ? spend.name : (othersTitle ?? spend.name),
      value: spend.amount,
      shareLabel: formatSharePercent(spend.percentage),
      color: getCategoryColor(spend.color),
    }),
  );
  const breakdown = segments
    .map((segment) =>
      i18n.t(k.transactions.spentShare, {
        ...options,
        name: segment.name,
        share: segment.shareLabel,
      }),
    )
    .join(', ');

  return {
    segments,
    headline: i18n.t(k.transactions.spentTotal, {
      ...options,
      amount: formatCompactAmount(total, locale),
    }),
    accessibilityLabel: i18n.t(k.transactions.spentSummary, {
      ...options,
      amount: formatCurrency(total),
      breakdown,
    }),
    accessibilityHint: i18n.t(k.transactions.spentHint, options),
  };
}
