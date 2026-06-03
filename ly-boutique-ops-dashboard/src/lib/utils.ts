/**
 * Tailwind classname merge utility.
 * Strips falsy values and joins with space.
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a number as currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

/**
 * Format a percentage with one decimal.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Truncate a string for display.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Get color class for a product grade.
 */
export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    S: 'text-accent-green bg-accent-green/10',
    A: 'text-accent-blue bg-accent-blue/10',
    B: 'text-accent-yellow bg-accent-yellow/10',
    C: 'text-accent-orange bg-accent-orange/10',
    D: 'text-accent-red bg-accent-red/10',
  };
  return map[grade] || 'text-text-muted bg-white/5';
}

/**
 * Debounce helper.
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
