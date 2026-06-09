import type { Well } from '../../../types';

export type WellStatus = Well['status'];

export interface StatusSlice {
  status: WellStatus;
  label: string;
  count: number;
  /** Percentage of the group, 0-100, rounded to a whole number. */
  pct: number;
  color: string;
}

export interface GroupWellSummary {
  total: number;
  slices: StatusSlice[];
  /** Average lateral length (ft) across the group's wells; 0 when empty. */
  avgLateralFt: number;
}

// Status colors are semantic (paired with labels in the UI), not theme accents.
const STATUS_META: { status: WellStatus; label: string; color: string }[] = [
  { status: 'PRODUCING', label: 'Producing', color: '#34d399' },
  { status: 'DUC', label: 'DUC', color: '#f0b86c' },
  { status: 'PERMIT', label: 'Permit', color: '#a78bfa' },
];

/**
 * Summarize a group's wells for the inspector: status breakdown (for the
 * donut) and average lateral length. Pure + deterministic for the donut.
 */
export function summarizeGroupWells(wells: Well[]): GroupWellSummary {
  const total = wells.length;
  const counts: Record<WellStatus, number> = { PRODUCING: 0, DUC: 0, PERMIT: 0 };
  let lateralSum = 0;
  for (const w of wells) {
    counts[w.status] = (counts[w.status] ?? 0) + 1;
    lateralSum += w.lateralLength || 0;
  }

  const slices: StatusSlice[] = STATUS_META.map(meta => ({
    status: meta.status,
    label: meta.label,
    color: meta.color,
    count: counts[meta.status],
    pct: total > 0 ? Math.round((counts[meta.status] / total) * 100) : 0,
  }));

  return {
    total,
    slices,
    avgLateralFt: total > 0 ? Math.round(lateralSum / total) : 0,
  };
}
