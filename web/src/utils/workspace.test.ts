import { describe, expect, it } from 'vitest';

import { resolveActiveWorkspaceId } from '@/utils/workspace';

describe('resolveActiveWorkspaceId', () => {
  const ids = ['personal', 'shared'];

  it('prefers the stored id, then the profile id, then the first workspace', () => {
    expect(resolveActiveWorkspaceId(ids, 'shared', 'personal')).toBe('shared');
    expect(resolveActiveWorkspaceId(ids, null, 'shared')).toBe('shared');
    expect(resolveActiveWorkspaceId(ids, null, null)).toBe('personal');
  });

  it('skips ids the user is no longer a member of', () => {
    expect(resolveActiveWorkspaceId(ids, 'deleted', 'shared')).toBe('shared');
    expect(resolveActiveWorkspaceId(ids, 'deleted', 'also-deleted')).toBe('personal');
  });

  it('returns null when there are no workspaces', () => {
    expect(resolveActiveWorkspaceId([], 'stored', 'profile')).toBeNull();
  });
});
