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

export function formatCompactAmount(value: number): string {
  if (value >= 1_000_000) {
    const compact = value / 1_000_000;
    return compact % 1 === 0 ? `${compact}M` : `${parseFloat(compact.toFixed(1))}M`;
  }
  if (value >= 1_000) {
    const compact = value / 1_000;
    return compact % 1 === 0 ? `${compact}K` : `${parseFloat(compact.toFixed(1))}K`;
  }
  return value % 1 === 0 ? `${value}` : `${parseFloat(value.toFixed(2))}`;
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
