export function processAmountKeyPress(prev: string, key: string): string {
  if (key === 'backspace') {
    return prev.slice(0, -1);
  }
  if (key === '.') {
    if (prev.includes('.')) return prev;
    return prev === '' ? '0.' : prev + '.';
  }
  // Max 2 decimal places
  const dotIndex = prev.indexOf('.');
  if (dotIndex !== -1 && prev.length - dotIndex >= 3) return prev;
  // No leading zeros
  if (prev === '0' && key !== '.') return key;
  // Limit length
  if (prev.replace('.', '').length >= 10) return prev;
  return prev + key;
}

export function formatDisplayAmount(amountString: string): string {
  if (!amountString) return '$0';
  if (amountString === '0.') return '$0.';
  const parts = amountString.split('.');
  const intPart = parseInt(parts[0] || '0', 10).toLocaleString('en-US');
  if (parts.length === 2) {
    return `$${intPart}.${parts[1]}`;
  }
  return `$${intPart}`;
}
