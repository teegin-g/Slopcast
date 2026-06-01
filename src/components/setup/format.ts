/** Compact well-count formatting for the Launchpad (e.g. 1.2M, 84.3K, 612). */
export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
  }
  return value.toLocaleString('en-US');
}

/** Full grouped integer (e.g. 1,204,883). */
export function formatCountExact(value: number): string {
  return value.toLocaleString('en-US');
}
