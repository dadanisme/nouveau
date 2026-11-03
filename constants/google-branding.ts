/**
 * Google Sign-In button colors, fixed by Google's branding guidelines
 * (developers.google.com/identity/branding-guidelines): the "light" button on light appearance,
 * the "dark" button on dark. Brand-mandated values, the one exception to the app's
 * system-colors-only rule, like the Sign in with Apple button's black/white.
 */
export const GOOGLE_BUTTON_COLORS = {
  light: { fill: '#FFFFFF', stroke: '#747775', text: '#1F1F1F' },
  dark: { fill: '#131314', stroke: '#8E918F', text: '#E3E3E3' },
} as const;

/** The minimum button height that matches the native prominent button beside it. */
export const SOCIAL_BUTTON_HEIGHT = { ios: 50, android: 48 } as const;
