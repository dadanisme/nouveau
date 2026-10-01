import { describe, expect, it } from 'vitest';

import { getInitials } from '@/utils/string';

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
