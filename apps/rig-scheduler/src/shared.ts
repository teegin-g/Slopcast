import type { ValueFormatterParams } from 'ag-grid-community';
import type {
  CapacityMode,
  ForcedAllocation,
  ManualRigAllocation,
  ManualYearAllocation,
  ScheduleRunRequest,
  SchedulerMode,
} from './types';

export type WorkbookSection = 'INVENTORY' | 'CONSTRAINTS' | 'OVERRIDES' | 'RESULTS';
export type OverrideSection = 'ANNUAL' | 'RIG' | 'FORCED';

export type ConstraintsGridRow = {
  id: string;
  yearIndex: number;
  yearLabel: string;
  rigCount: number;
  capexBudget: number;
};

export type AnnualOverrideRow = ManualYearAllocation & { id: string; yearLabel: string; bucketName: string };
export type RigOverrideRow = ManualRigAllocation & { id: string; yearLabel: string; bucketName: string };
export type ForcedOverrideRow = ForcedAllocation & { id: string; yearLabel: string; bucketName: string };

export const WORKBOOK_SECTIONS: Array<{ id: WorkbookSection; label: string; title: string; subtitle: string }> = [
  {
    id: 'INVENTORY',
    label: 'Inventory',
    title: 'Inventory Workbook',
    subtitle: 'Edit bucket-level inventory, economics, and timing assumptions in one grid.',
  },
  {
    id: 'CONSTRAINTS',
    label: 'Constraints',
    title: 'Constraint Workbook',
    subtitle: 'Tune planning horizon, rig logic, and annual budget / fleet rows together.',
  },
  {
    id: 'OVERRIDES',
    label: 'Overrides',
    title: 'Override Workbook',
    subtitle: 'Lock annual, per-rig, or forced scheduling intent before auto-fill runs.',
  },
  {
    id: 'RESULTS',
    label: 'Results',
    title: 'Results Workbook',
    subtitle: 'Review annual output, deferred inventory, warnings, and the synchronized rig timeline.',
  },
];

export const OVERRIDE_SECTIONS: Array<{ id: OverrideSection; label: string }> = [
  { id: 'ANNUAL', label: 'Annual' },
  { id: 'RIG', label: 'Per Rig' },
  { id: 'FORCED', label: 'Forced' },
];

export const modeLabels: Record<SchedulerMode, string> = {
  AUTO: 'Auto',
  MANUAL_YEAR: 'Manual Year',
  MANUAL_RIG: 'Manual Rig',
  HYBRID: 'Hybrid',
};

export const capacityLabels: Record<CapacityMode, string> = {
  RATE: 'Wells / Rig / Year',
  CYCLE_DAYS: 'Cycle Days',
};

export const colors = ['#7dd3fc', '#86efac', '#f9a8d4', '#fdba74', '#c4b5fd', '#fca5a5'];
export const GRID_THEME_CLASS = 'ag-theme-quartz workbook-grid-theme';

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const fmtCurrency = (value: number) => currencyFormat.format(value);

export const fmtCompact = (value: number) => compactFormat.format(value);

export const cloneRequest = (request: ScheduleRunRequest) => structuredClone(request);

export const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const currencyFormatter = (params: ValueFormatterParams<any, number | null>) => {
  if (params.value == null) return 'Unconstrained';
  return fmtCurrency(params.value);
};

export const stringToTitle = (value: string) => value.toLowerCase().replace(/_/g, ' ');
