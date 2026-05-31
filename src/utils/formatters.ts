// Shared formatting utilities

// --- Feet formatter ---

const FEET_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatFeet(value: number): string {
  return `${FEET_FORMATTER.format(value)} ft`;
}

// --- DateTime formatter ---

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Formats an ISO date string for display.
 * @param value - ISO date string or nullish
 * @param emptyLabel - Label to return when value is missing (default: 'Not available')
 * Returns 'Unknown' for unparseable strings.
 */
export function formatDateTime(value?: string | null, emptyLabel = 'Not available'): string {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return DATE_TIME_FORMATTER.format(date);
}
