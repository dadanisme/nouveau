// Store-art tokens: system font, accent only as an accent (never text on white), semantic neutrals from the app.
export const ART = {
  accent: '#E24A00',
  white: '#FFFFFF',
  grouped: '#F2F2F7',
  tint: '#FDEBDF',
  text: '#1C1C1E',
  textSecondary: '#48484A',
  font: '"SF Pro Display", -apple-system, system-ui, "Helvetica Neue", sans-serif',
};

export type Lang = 'id' | 'en';
export type Kind = 'header' | 'search';

// Copy (ID and EN): "family finance" / "keuangan keluarga", not "money". No prices, URLs, awards or other platforms.
export const COPY: Record<Kind, Record<Lang, { headline: string[]; subline?: string }>> = {
  header: {
    id: { headline: ['Keuangan keluarga', 'yang terbuka'], subline: 'Dibuat oleh pasangan, untuk keluarga' },
    en: { headline: ['Family finance,', 'out in the open'], subline: 'Made by a couple, for families' },
  },
  search: {
    id: { headline: ['Keuangan keluarga,', 'terbuka bersama'] },
    en: { headline: ['Family finance,', 'open together'] },
  },
};

export const SIZES = {
  header: { width: 3840, height: 1646, safe: { x0: 672, x1: 3168, y0: 150, y1: 1496 } }, // middle 65% of the width
  search: { width: 3000, height: 2000, safe: { x0: 450, x1: 2550, y0: 150, y1: 1850 } }, // middle 70% x, 150 px top/bottom
};
