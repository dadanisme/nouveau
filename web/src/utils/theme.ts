export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

/** What the user picked. `system` follows the operating system. */
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** What is actually shown. */
export type Theme = 'light' | 'dark';

/** A stored preference, or `system` when nothing (or something unknown) is stored. */
export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'system';
}

/** The theme to show for a preference, given whether the OS asks for dark. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
