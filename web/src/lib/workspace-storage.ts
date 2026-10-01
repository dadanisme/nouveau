/** Same key as the mobile app's workspace context. */
export const WORKSPACE_STORAGE_KEY = 'active_workspace_id';

export function readStoredWorkspaceId(): string | null {
  return localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function writeStoredWorkspaceId(id: string): void {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}

export function clearStoredWorkspaceId(): void {
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
}
