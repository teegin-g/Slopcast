
export interface Well {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lateralLength: number; // in feet
  status: 'PRODUCING' | 'DUC' | 'PERMIT';
  operator: string;
  formation: string;
}

export interface TypeCurveParams {
  qi: number; // Initial Production (bbl/d)
  b: number; // b-factor
  di: number; // Nominal initial decline rate (annual %)
  terminalDecline: number; // Terminal decline (annual %)
  gorMcfPerBbl: number; // Gas-Oil Ratio (mcf/bbl) used to derive gas volumes
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

export interface WellGroup {
  id: string;
  name: string;
  color: string;
  wellIds: Set<string>;
  typeCurve: TypeCurveParams;
  capex: CapexAssumptions;
  opex: OpexAssumptions;
  ownership: OwnershipAssumptions;
  reserveCategory?: ReserveCategory;
  taxAssumptions?: TaxAssumptions;
  debtAssumptions?: DebtAssumptions;
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

export type ProjectMemberRole = 'owner' | 'editor' | 'viewer';

export interface ProjectUiState {
  designWorkspace?: 'WELLS' | 'ECONOMICS';
  economicsResultsTab?: 'SUMMARY' | 'CHARTS' | 'DRIVERS';
  operatorFilter?: string;
  formationFilter?: string;
  statusFilter?: Well['status'] | 'ALL';
}

export interface ProjectRecord {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  activeGroupId: string | null;
  uiState: ProjectUiState;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGroupRecord {
  id: string;
  projectId: string;
  name: string;
  color: string;
  sortOrder: number;
  wellIds: string[];
  typeCurve: TypeCurveParams;
  capex: CapexAssumptions;
  opex: OpexAssumptions;
  ownership: OwnershipAssumptions;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectScenarioRecord {
  id: string;
  projectId: string;
  name: string;
  color: string;
  isBaseCase: boolean;
  pricing: CommodityPricingAssumptions;
  schedule: ScheduleParams;
  capexScalar: number;
  productionScalar: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EconomicsRunRecord {
  id: string;
  projectId: string;
  triggeredBy: string;
  inputHash: string;
  portfolioMetrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    payoutMonths: number;
    wellCount: number;
  };
  warnings: string[];
  createdAt: string;
}

export interface EconomicsRunGroupMetricRecord {
  economicsRunId: string;
  projectGroupId: string;
  rank: number | null;
  metrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    roi: number;
    payoutMonths: number;
    wellCount: number;
  };
}
