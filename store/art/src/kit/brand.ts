import { SYSTEM_STACK } from './fonts';

// MARK: - Brand tokens: the ONLY place a product's identity lives. Fill from references/brand-detection.md.
// Web fonts: see kit/fonts.ts (googleFont + fontStack) to load the site's own fonts with @remotion/google-fonts.

export const BRAND = {
  appName: 'Acme Notes',
  /** Accent colour (pill dot, last tagline, icon fallback). Take it from the app's AccentColor / theme. */
  accent: '#3b6cf6',
  /** Background radial gradient stops: centre, mid, edge. */
  bg: ['#ffffff', '#f4f5f8', '#e7e9ee'] as const,
  text: '#1d1d1f',
  textSecondary: '#48484d',
  textTertiary: '#a1a1a6',
  font: SYSTEM_STACK,
  /** Optional extra families: headline = the Wordmark name + accent word (e.g. a site's serif). '' = use `font`. */
  fonts: { headline: '' as string },
  /** App icon under public/ (e.g. 'brand/icon.png'); '' draws a rounded accent tile with the initial. */
  iconPath: '',
  /** Full logo image under public/ (Wordmark mark="logo"), e.g. a wide transparent site logo. */
  logoPath: '',
  captionPlate: 'rgba(16, 16, 20, 0.88)',
  captionText: '#ffffff',
  pillBg: 'rgba(255, 255, 255, 0.86)',
};

export const background = (b = BRAND) =>
  `radial-gradient(120% 120% at 50% 38%, ${b.bg[0]} 0%, ${b.bg[1]} 55%, ${b.bg[2]} 100%)`;
