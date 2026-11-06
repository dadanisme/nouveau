/**
 * Whether a screen is still waiting for its data. A query with no data yet counts as loading,
 * including while it's disabled for want of the workspace or the data source: React Query v5's
 * `isLoading` is false for a disabled query, which read as an empty month on a cold launch. With
 * no workspace on its way (none resolved, none resolving), there's nothing to wait for.
 */
export function isAwaitingData(
  queries: readonly { isPending: boolean }[],
  workspace: { id: string | null | undefined; isResolving: boolean },
): boolean {
  if (!workspace.id && !workspace.isResolving) return false;
  return queries.some((query) => query.isPending);
}
