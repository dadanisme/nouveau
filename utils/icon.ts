/**
 * Parses an icon string in the format "Library/icon-name"
 * e.g. "Ionicons/restaurant" → { library: "Ionicons", name: "restaurant" }
 */
export function parseIcon(icon: string): { library: string; name: string } | null {
  const parts = icon.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { library: parts[0], name: parts[1] };
}
