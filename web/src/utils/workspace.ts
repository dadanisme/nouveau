/**
 * Picks the active workspace from the ones the user belongs to.
 * Order of preference: the locally stored id, the id saved on the user row, the first
 * workspace (personal first). Ids that are no longer in the list (deleted workspace,
 * removed membership) are skipped.
 */
export function resolveActiveWorkspaceId(
  workspaceIds: string[],
  storedId: string | null,
  profileId: string | null | undefined,
): string | null {
  if (storedId && workspaceIds.includes(storedId)) return storedId;
  if (profileId && workspaceIds.includes(profileId)) return profileId;
  return workspaceIds[0] ?? null;
}
