export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Fills `%{name}` placeholders, the interpolation syntax the mobile locale files use. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/%\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
