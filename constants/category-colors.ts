// Color palette for category customization
// Covers the full hue range including app theme colors

export const CATEGORY_COLORS = [
  // Reds
  '#EF4444',
  '#DC2626',
  '#F97316',
  '#EA580C',

  // Amber / Yellow (includes app primary)
  '#F59E0B',
  '#EAB308',
  '#FACC15',
  '#CA8A04',

  // Greens (includes app income)
  '#22C55E',
  '#16A34A',
  '#10B981',
  '#14B8A6',
  '#059669',
  '#84CC16',

  // Blues
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#2563EB',
  '#6366F1',
  '#0891B2',

  // Purples
  '#8B5CF6',
  '#7C3AED',
  '#A855F7',
  '#D946EF',
  '#C026D3',

  // Pinks
  '#EC4899',
  '#F43F5E',
  '#E11D48',
  '#DB2777',

  // Neutrals
  '#78716C',
  '#64748B',
  '#475569',
  '#1F2937',
  '#44403C',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];
