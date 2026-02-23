// Color palette for category customization
// Covers the full hue range including app theme colors

export const CATEGORY_COLORS = [
  // Reds
  '#EF4444',
  '#F97316',

  // Amber / Yellow (includes app primary)
  '#F59E0B',
  '#EAB308',

  // Greens (includes app income)
  '#22C55E',
  '#16A34A',
  '#10B981',
  '#14B8A6',

  // Blues
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',

  // Purples
  '#8B5CF6',
  '#A855F7',
  '#D946EF',

  // Pinks
  '#EC4899',
  '#F43F5E',

  // Neutrals
  '#78716C',
  '#64748B',
  '#1F2937',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];
