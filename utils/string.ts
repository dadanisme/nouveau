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
