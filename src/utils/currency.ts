/**
 * Formats a numeric amount in FCFA without unnecessary decimals.
 * e.g. 400 -> "400 FCFA", 10000 -> "10 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 FCFA';
  }
  // Format with space as thousands separator
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR', {
    useGrouping: true,
    maximumFractionDigits: 0
  }).format(rounded);
  
  return `${formatted} FCFA`;
}

/**
 * Format signed FCFA (e.g. +5 000 FCFA, -400 FCFA)
 */
export function formatSignedFCFA(amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatFCFA(amount)}`;
}
