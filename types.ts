
export interface Well {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lateralLength: number; // in feet
  status: 'PRODUCING' | 'DUC' | 'PERMIT';
  operator: string;
}

export interface TypeCurveParams {
  qi: number; // Initial Production (bbl/d)
  b: number; // b-factor
  di: number; // Nominal initial decline rate (annual %)
  terminalDecline: number; // Terminal decline (annual %)
}

export type CapexCategory = 'DRILLING' | 'COMPLETION' | 'FACILITIES' | 'EQUIPMENT' | 'OTHER';
export type CostBasis = 'PER_WELL' | 'PER_FOOT';

export interface CapexItem {
  id: string;
  name: string;
  category: CapexCategory;
  value: number;
  basis: CostBasis;
  offsetDays: number; // Days from Rig Start
}

export interface CapexAssumptions {
  rigCount: number; // Legacy/Default for Groups
  drillDurationDays: number;
  stimDurationDays: number;
  rigStartDate: string; // ISO date string
  items: CapexItem[];
}

export interface PricingAssumptions {
  oilPrice: number; // $/bbl
  gasPrice: number; // $/mcf
  oilDifferential: number; // $/bbl deduction
  gasDifferential: number; // $/mcf deduction
  nri: number; // Net Revenue Interest (decimal)
  loePerMonth: number; // Lease Operating Expense ($/mo)
}

export interface MonthlyCashFlow {
  month: number;
  date: string;
  oilProduction: number;
  revenue: number;
  capex: number;
  opex: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface DealMetrics {
  totalCapex: number;
  eur: number; // Estimated Ultimate Recovery
  npv10: number; // Net Present Value @ 10%
  irr: number; // Internal Rate of Return (approximation)
  payoutMonths: number;
  wellCount: number;
}

export interface WellGroup {
  id: string;
  name: string;
  color: string;
  wellIds: Set<string>;
  typeCurve: TypeCurveParams;
  capex: CapexAssumptions;
  pricing: PricingAssumptions;
  // Computed for display
  metrics?: DealMetrics;
  flow?: MonthlyCashFlow[];
}

// --- NEW SCENARIO TYPES ---

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
  pricing: PricingAssumptions; 
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
