import { supabase } from '@/lib/supabase';

export const API_BASE_URL = 'https://moneymail-api-1016548251938.asia-southeast2.run.app';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function authenticatedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let message: string;
    try {
      const json = JSON.parse(body);
      message = json.error?.message ?? json.error ?? json.message ?? body;
    } catch {
      message = body || `Request failed with status ${response.status}`;
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
