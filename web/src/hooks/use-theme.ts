import { useEffect, useSyncExternalStore } from 'react';

import { readThemePreference, THEME_STORAGE_KEY, writeThemePreference } from '@/lib/theme-storage';
import { applyTheme } from '@/utils/dom';
import { parseThemePreference, resolveTheme, type ThemePreference } from '@/utils/theme';

const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

// The preference lives outside React so every `useTheme` caller shares one value.
let currentPreference = readThemePreference();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribePreference(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getPreference() {
  return currentPreference;
}

function setPreference(preference: ThemePreference) {
  currentPreference = preference;
  writeThemePreference(preference);
  notify();
}

function subscribeSystem(listener: () => void) {
  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

function getSystemPrefersDark() {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

/**
 * The theme preference (System, Light or Dark, kept in localStorage) and the theme it resolves
 * to. System follows the OS setting and changes with it while the page is open.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribePreference, getPreference);
  const systemPrefersDark = useSyncExternalStore(subscribeSystem, getSystemPrefersDark);

  return { preference, theme: resolveTheme(preference, systemPrefersDark), setPreference };
}

/**
 * Keeps `<html>` in step with the theme. Mounted once, at the root. The first paint is handled
 * by the inline script in `index.html`; this takes over from there, and also picks up a change
 * made in another tab.
 */
export function useThemeSync() {
  const { theme } = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      // `key` is null when the whole storage was cleared.
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      currentPreference = parseThemePreference(event.key === null ? null : event.newValue);
      notify();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}
