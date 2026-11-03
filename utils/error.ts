/**
 * A readable message for a thrown value. Supabase returns errors as plain `{ message, code }`
 * objects (not `Error` instances), so read `message` from either.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

/** The Postgres error code of a Supabase error (e.g. `23503`, a foreign key violation). */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown };
    if (typeof code === 'string') return code;
  }
  return undefined;
}
