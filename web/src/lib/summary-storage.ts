const BREAKDOWN_OPEN_KEY = 'summary_breakdown_open';

/** Whether the summary strip's category breakdown is expanded. Collapsed until opened once. */
export function readBreakdownOpen(): boolean {
  return localStorage.getItem(BREAKDOWN_OPEN_KEY) === 'true';
}

export function writeBreakdownOpen(isOpen: boolean): void {
  localStorage.setItem(BREAKDOWN_OPEN_KEY, String(isOpen));
}
