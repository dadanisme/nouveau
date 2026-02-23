export function processAmountKeyPress(prev: string, key: string): string {
  if (key === 'backspace') {
    return prev.slice(0, -1);
  }
  // IDR doesn't use decimals
  if (key === '.') return prev;
  // No leading zeros
  if (prev === '0') return key;
  // Limit length
  if (prev.length >= 12) return prev;
  return prev + key;
}

export function formatCompactAmount(value: number): string {
  if (value >= 1_000_000_000) {
    const compact = value / 1_000_000_000;
    return compact % 1 === 0 ? `Rp${compact}B` : `Rp${parseFloat(compact.toFixed(1))}B`;
  }
  if (value >= 1_000_000) {
    const compact = value / 1_000_000;
    return compact % 1 === 0 ? `Rp${compact}M` : `Rp${parseFloat(compact.toFixed(1))}M`;
  }
  if (value >= 1_000) {
    const compact = value / 1_000;
    return compact % 1 === 0 ? `Rp${compact}K` : `Rp${parseFloat(compact.toFixed(1))}K`;
  }
  return `Rp${Math.round(value)}`;
}

export function formatCurrency(value: number): string {
  return `Rp${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

export function formatDisplayAmount(amountString: string): string {
  if (!amountString) return 'Rp0';
  const intPart = parseInt(amountString, 10).toLocaleString('id-ID');
  return `Rp${intPart}`;
}
