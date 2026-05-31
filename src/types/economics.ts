import type { RigScheduleFields } from './scenarios';

export type CutoffKind = 'rate' | 'cum' | 'time_days' | 'decline' | 'default';

export interface ForecastSegment {
  id: string;
  name: string;
  method: string;          // 'arps' for now
  qi: number | null;       // null = inherit from previous segment end rate
  b: number | null;        // null = inherit
  initialDecline: number | null; // Di %/yr, null = inherit
  cutoffKind: CutoffKind;
  cutoffValue: number | null; // null when kind='default' (use horizon)
}

export interface TypeCurveParams {
  qi: number; // Initial Production (bbl/d)
  b: number; // b-factor
  di: number; // Nominal initial decline rate (annual %)
  terminalDecline: number; // Terminal decline (annual %)
  gorMcfPerBbl: number; // Gas-Oil Ratio (mcf/bbl) used to derive gas volumes
  segments?: ForecastSegment[]; // Multi-segment forecast (source of truth when present)
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

// Shared rig-schedule fields — see RigScheduleFields in types/scenarios.ts.
// The composed object shape is identical to before; only the declaration is DRY'd.
export interface CapexAssumptions extends RigScheduleFields {
  rigCount: number; // Legacy/Default for Groups
  items: CapexItem[];
}

export interface CommodityPricingAssumptions {
  oilPrice: number; // $/bbl
  gasPrice: number; // $/mcf
  oilDifferential: number; // $/bbl deduction
  gasDifferential: number; // $/mcf deduction
}

export interface OpexSegment {
  id: string;
  label: string;
  startMonth: number; // Well-age month (1 = first producing month)
  endMonth: number; // Well-age month (inclusive)
  fixedPerWellPerMonth: number; // $/well/month
  variableOilPerBbl: number; // $/bbl
  variableGasPerMcf: number; // $/mcf
}

export interface OpexAssumptions {
  segments: OpexSegment[];
}

export interface JvAgreementTerms {
  conveyRevenuePctOfBase: number; // 0..1 (fraction of base NRI conveyed)
  conveyCostPctOfBase: number; // 0..1 (fraction of base cost interest conveyed)
}

export interface JvAgreement {
  id: string;
  name: string;
  startMonth: number; // Calendar month (1..N)
  prePayout: JvAgreementTerms;
  postPayout: JvAgreementTerms;
}

export interface OwnershipAssumptions {
  baseNri: number; // 0..1
  baseCostInterest: number; // 0..1
  agreements: JvAgreement[];
}

export type ReserveCategory = 'PDP' | 'PUD' | 'PROBABLE' | 'POSSIBLE';

export interface ReserveClassification {
  category: ReserveCategory;
  riskFactor: number; // PDP=1.0, PUD=0.85, Probable=0.50, Possible=0.15
}

// DEFAULT_RESERVE_RISK_FACTORS has moved to src/constants.ts

export interface TaxAssumptions {
  severanceTaxPct: number;       // % of gross revenue (TX ~4.6% oil, 7.5% gas)
  adValoremTaxPct: number;       // % of assessed value (~1-2%)
  federalTaxRate: number;        // % (default 21%)
  depletionAllowancePct: number; // % of gross income (15% for independent producers)
  stateTaxRate: number;          // % (0% for TX, varies by state)
}

// TAX_PRESETS and DEFAULT_TAX_ASSUMPTIONS have moved to src/constants.ts

export interface DebtAssumptions {
  enabled: boolean;
  revolverSize: number;          // max draw amount
  revolverRate: number;          // annual interest rate %
  termLoanAmount: number;
  termLoanRate: number;
  termLoanAmortMonths: number;
  cashSweepPct: number;          // % of excess cash flow to debt paydown
}

// DEFAULT_DEBT_ASSUMPTIONS has moved to src/constants.ts

export interface MonthlyCashFlow {
  month: number;
  date: string;
  oilProduction: number;
  gasProduction: number;
  revenue: number;
  capex: number;
  opex: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  // After-tax fields (populated when tax assumptions provided)
  severanceTax?: number;
  adValoremTax?: number;
  incomeTax?: number;
  afterTaxCashFlow?: number;
  cumulativeAfterTaxCashFlow?: number;
  // Levered fields (populated when debt assumptions enabled)
  interestExpense?: number;
  principalPayment?: number;
  leveredCashFlow?: number;
  cumulativeLeveredCashFlow?: number;
  outstandingDebt?: number;
}

export interface DealMetrics {
  totalCapex: number;
  eur: number; // Estimated Ultimate Recovery
  npv10: number; // Net Present Value @ 10%
  irr?: number; // Internal Rate of Return (approximation)
  payoutMonths: number;
  wellCount: number;
  // After-tax metrics (populated when tax assumptions provided)
  afterTaxNpv10?: number;
  afterTaxPayoutMonths?: number;
  // Levered metrics (populated when debt assumptions enabled)
  leveredNpv10?: number;
  equityIrr?: number;
  dscr?: number; // Debt service coverage ratio
  // Risked metrics (populated when reserves classification set)
  riskedEur?: number;
  riskedNpv10?: number;
}

export interface EconomicsCalculationInput {
  wells: import('./wells').Well[];
  typeCurve: TypeCurveParams;
  capex: CapexAssumptions;
  pricing: CommodityPricingAssumptions;
  opex: OpexAssumptions;
  ownership: OwnershipAssumptions;
  scalars?: { capex: number; production: number };
  scheduleOverride?: import('./scenarios').ScheduleParams | null;
  taxAssumptions?: TaxAssumptions | null;
  debtAssumptions?: DebtAssumptions | null;
  reserveCategory?: ReserveCategory | null;
}
