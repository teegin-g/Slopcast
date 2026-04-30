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

export interface CapexAssumptions {
  rigCount: number; // Legacy/Default for Groups
  drillDurationDays: number;
  stimDurationDays: number;
  rigStartDate: string; // ISO date string
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

export const DEFAULT_RESERVE_RISK_FACTORS: Record<ReserveCategory, number> = {
  PDP: 1.0,
  PUD: 0.85,
  PROBABLE: 0.50,
  POSSIBLE: 0.15,
};

export interface TaxAssumptions {
  severanceTaxPct: number;       // % of gross revenue (TX ~4.6% oil, 7.5% gas)
  adValoremTaxPct: number;       // % of assessed value (~1-2%)
  federalTaxRate: number;        // % (default 21%)
  depletionAllowancePct: number; // % of gross income (15% for independent producers)
  stateTaxRate: number;          // % (0% for TX, varies by state)
}

export const TAX_PRESETS: Record<string, TaxAssumptions> = {
  Texas: { severanceTaxPct: 4.6, adValoremTaxPct: 1.5, federalTaxRate: 21, depletionAllowancePct: 15, stateTaxRate: 0 },
  'New Mexico': { severanceTaxPct: 3.75, adValoremTaxPct: 1.0, federalTaxRate: 21, depletionAllowancePct: 15, stateTaxRate: 4.8 },
  Oklahoma: { severanceTaxPct: 5.0, adValoremTaxPct: 1.0, federalTaxRate: 21, depletionAllowancePct: 15, stateTaxRate: 4.0 },
  Colorado: { severanceTaxPct: 5.0, adValoremTaxPct: 1.0, federalTaxRate: 21, depletionAllowancePct: 15, stateTaxRate: 4.4 },
};

export const DEFAULT_TAX_ASSUMPTIONS: TaxAssumptions = TAX_PRESETS.Texas;

export interface DebtAssumptions {
  enabled: boolean;
  revolverSize: number;          // max draw amount
  revolverRate: number;          // annual interest rate %
  termLoanAmount: number;
  termLoanRate: number;
  termLoanAmortMonths: number;
  cashSweepPct: number;          // % of excess cash flow to debt paydown
}

export const DEFAULT_DEBT_ASSUMPTIONS: DebtAssumptions = {
  enabled: false,
  revolverSize: 50_000_000,
  revolverRate: 8.0,
  termLoanAmount: 0,
  termLoanRate: 7.0,
  termLoanAmortMonths: 60,
  cashSweepPct: 50,
};

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
  irr: number; // Internal Rate of Return (approximation)
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
