import type { CommodityPricingAssumptions } from './economics';

export interface ScheduleParams {
    annualRigs: number[]; // Array of rig counts by year (Idx 0 = Year 1)
    drillDurationDays: number;
    stimDurationDays: number;
    rigStartDate: string;
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
