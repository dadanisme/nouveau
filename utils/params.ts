/** Parse an integer route param, returning null when missing or malformed */
export function parseIntParam(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}
