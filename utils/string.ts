export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Whether a stored display name only stands in for a real one: empty, the email, or its local
 * part (what an account created without a name ends up with).
 */
export function isPlaceholderDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): boolean {
  const name = displayName?.trim().toLowerCase() ?? '';
  const address = email?.trim().toLowerCase() ?? '';
  return !name || (!!address && (name === address || name === address.split('@')[0]));
}

/**
 * Joins short values with a middle dot ("Personal · IDR"). A no-break space before each dot keeps
 * it with the value on its left, so text that wraps at large text sizes never starts a line with
 * "·".
 */
export function joinWithDot(parts: readonly (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ');
}
