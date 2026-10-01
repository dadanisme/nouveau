import { describe, expect, it } from 'vitest';

import { parseThemePreference, resolveTheme } from '@/utils/theme';

describe('parseThemePreference', () => {
  it('keeps a known preference', () => {
    expect(parseThemePreference('system')).toBe('system');
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('falls back to system when nothing or something unknown is stored', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference(undefined)).toBe('system');
    expect(parseThemePreference('')).toBe('system');
    expect(parseThemePreference('Dark')).toBe('system');
    expect(parseThemePreference('sepia')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('follows the OS when the preference is system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('ignores the OS for an explicit choice', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
