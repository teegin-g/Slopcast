import type { CommodityPricingAssumptions } from './economics';

/**
 * Shared rig-schedule fields duplicated across ScheduleParams and CapexAssumptions.
 * Both types extend this interface so they remain shape-identical to persisted JSONB —
 * field names and nesting are NOT changed, only the declaration is DRY'd.
 */
export interface RigScheduleFields {
  drillDurationDays: number;
  stimDurationDays: number;
  rigStartDate: string; // ISO date string
}

export interface ScheduleParams extends RigScheduleFields {
    annualRigs: number[]; // Array of rig counts by year (Idx 0 = Year 1)
}

export interface Scenario {
  id: string;
  name: string;
  color: string;
  isBaseCase: boolean;
  // Overrides / Scalars
  pricing: CommodityPricingAssumptions;
  schedule: ScheduleParams;
  capexScalar: number;
  productionScalar: number;
}

export type SensitivityVariable = 'OIL_PRICE' | 'CAPEX_SCALAR' | 'EUR_SCALAR' | 'RIG_COUNT';

export interface SensitivityMatrixResult {
  xValue: number;
  yValue: number;
  npv: number;
}
