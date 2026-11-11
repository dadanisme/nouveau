import { SYSTEM_STACK } from './fonts';

// MARK: - Brand tokens: the ONLY place a product's identity lives.
// Nouveau: accent #E24A00 (a tint only, never a fill behind small text), white / grouped gray, near-black text, system font.
// public/brand/icon.png exists for the kit only: an App Store preview has no closing card (Guideline 2.3.4).

export const BRAND = {
  appName: 'Nouveau',
  accent: '#E24A00',
  bg: ['#FFFFFF', '#F7F7FA', '#F2F2F7'] as const,
  text: '#1C1C1E',
  textSecondary: '#48484A',
  textTertiary: '#8E8E93',
  font: SYSTEM_STACK,
  fonts: { headline: '' as string },
  iconPath: 'brand/icon.png',
  logoPath: '',
  captionPlate: 'rgba(255, 255, 255, 0.94)',
  captionText: '#1C1C1E',
  pillBg: 'rgba(255, 255, 255, 0.92)',
};

export const background = (b = BRAND) =>
  `radial-gradient(120% 120% at 50% 38%, ${b.bg[0]} 0%, ${b.bg[1]} 55%, ${b.bg[2]} 100%)`;
