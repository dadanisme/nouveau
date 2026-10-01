import { describe, expect, it } from 'vitest';

import { getInitials, interpolate } from '@/utils/string';

describe('getInitials', () => {
  it('uses the first letters of the first two words', () => {
    expect(getInitials('muhammad ramdan nouveau')).toBe('MR');
  });

  it('handles single names, extra whitespace and empty input', () => {
    expect(getInitials('Ramdan')).toBe('R');
    expect(getInitials('  Ada   Lovelace ')).toBe('AL');
    expect(getInitials('')).toBe('');
  });
});

describe('interpolate', () => {
  it('fills placeholders and leaves unknown ones', () => {
    expect(interpolate('%{count} of %{total}', { count: 2, total: 10 })).toBe('2 of 10');
    expect(interpolate('Hello %{name}', {})).toBe('Hello %{name}');
  });
});
