import { parseThemePreference, type ThemePreference } from '@/utils/theme';

/** Also read by the inline script in `index.html`, which applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'theme_preference';

/** The stored preference; `system` when there is none or storage is unavailable. */
export function readThemePreference(): ThemePreference {
  try {
    return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage is blocked or full: the choice still applies to this page, it is just not kept.
  }
}
