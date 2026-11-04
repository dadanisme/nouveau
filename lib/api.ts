import { WORKSPACE_STORAGE_KEY } from '@/contexts/workspace';
import { supabase } from '@/lib/supabase';

/**
 * The moneymail backend. `EXPO_PUBLIC_API_BASE_URL` (e.g. in `.env.local`) points a dev build at
 * another server, such as a tunnel to a local one.
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://goofy.nouveau.my.id'
).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  /**
   * The machine-readable error the server sent (`{ error: 'reauth_required' }`, or the message
   * of `{ error: { message } }`), for callers that branch on it.
   */
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const workspaceId =
    typeof localStorage !== 'undefined' ? localStorage.getItem(WORKSPACE_STORAGE_KEY) : null;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let message: string;
    let code: string | undefined;
    try {
      const json = JSON.parse(body);
      message = json.error?.message ?? json.error ?? json.message ?? body;
      code = typeof message === 'string' ? message : undefined;
    } catch {
      message = body || `Request failed with status ${response.status}`;
    }
    throw new ApiError(message, response.status, code);
  }

  // 204 No Content (e.g. a DELETE) has no body to parse.
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
