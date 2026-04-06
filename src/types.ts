
export interface WellTrajectoryPoint {
  lat: number;
  lng: number;
  depthFt: number; // TVD in feet (0 = surface, positive = deeper)
}

export interface WellTrajectory {
  /** Full survey path from surface to TD — ordered by measured depth.
   *  Primary source: directional survey stations (100-200 points).
   *  Fallback: 3-point path from well header SH/BH coordinates. */
  path: WellTrajectoryPoint[];
  /** Summary control points (always populated) */
  surface: WellTrajectoryPoint;
  heel: WellTrajectoryPoint;
  toe: WellTrajectoryPoint;
  mdFt?: number;
}

export interface Well {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lateralLength: number; // in feet
  status: 'PRODUCING' | 'DUC' | 'PERMIT';
  operator: string;
  formation: string;
  trajectory?: WellTrajectory;  // Optional: populated when laterals layer active
}

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
export type OrganizationRole = 'org_owner' | 'org_admin' | 'org_member';
export type ProjectKind = 'portfolio_model' | 'deal_evaluation';
export type ProjectVersionKind = 'checkpoint' | 'pre_run' | 'published' | 'migration';
export type ProjectArtifactType = 'memo' | 'report' | 'export' | 'attachment';
export type ModelPresetScope = 'user' | 'organization';

export interface ProjectUiState {
  designWorkspace?: 'WELLS' | 'ECONOMICS';
  economicsResultsTab?: 'OVERVIEW' | 'CASH_FLOW' | 'RESERVES';
  operatorFilter?: string;
  formationFilter?: string;
  statusFilter?: Well['status'] | 'ALL';
}

export interface ProjectRecord {
  id: string;
  organizationId?: string;
  ownerUserId: string;
  projectKind?: ProjectKind;
  status?: string;
  name: string;
  description: string | null;
  activeGroupId: string | null;
  uiState: ProjectUiState;
  currentVersionId?: string | null;
  metadata?: Record<string, unknown>;
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
  projectVersionId?: string | null;
  triggeredBy: string;
  inputHash: string;
  runKind?: string;
  engineVersion?: string;
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

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'disabled';
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectVersionRecord {
  id: string;
  projectId: string;
  versionNo: number;
  versionKind: ProjectVersionKind;
  createdBy: string | null;
  changeReason: string | null;
  snapshot: Record<string, unknown>;
  inputHash: string | null;
  createdAt: string;
}

export interface ProjectArtifactRecord {
  id: string;
  projectId: string;
  artifactType: ProjectArtifactType | string;
  sourceRunId: string | null;
  storagePath: string;
  metadata: Record<string, unknown>;
  createdBy: string | null;
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

// --- DEAL MODEL TYPES ---

export type DealStatus = 'draft' | 'active' | 'closed' | 'archived';
export type DealWellType = 'developed' | 'undeveloped';

export interface DealRecord {
  id: string;
  ownerUserId: string;
  name: string;
  category: string | null;
  status: DealStatus;
  basin: string | null;
  metadata: Record<string, unknown>;
  baselineScenarioId: string | null;
  kpis: {
    incrementalReserves?: number;
    pv10?: number;
    offerPrice?: number;
    wellCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DealWellRecord {
  id: string;
  dealId: string;
  wellId: string | null;
  slopcastWellId: string;
  groupId: string | null;
  wellType: DealWellType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DealWellGroupRecord {
  id: string;
  dealId: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealProductionProfile {
  id: string;
  dealId: string;
  groupId: string | null;
  wellId: string | null;
  name: string;
  qi: number;
  b: number;
  di: number;
  terminalDecline: number;
  gorMcfPerBbl: number;
  waterCut: number;
  params: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DealCapexProfile {
  id: string;
  dealId: string;
  groupId: string | null;
  wellId: string | null;
  name: string;
  rigCount: number;
  drillDurationDays: number;
  stimDurationDays: number;
  rigStartDate: string | null;
  items: CapexItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DealOpexProfile {
  id: string;
  dealId: string;
  groupId: string | null;
  wellId: string | null;
  name: string;
  segments: OpexSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface DealOwnershipProfile {
  id: string;
  dealId: string;
  groupId: string | null;
  wellId: string | null;
  name: string;
  baseNri: number;
  baseCostInterest: number;
  agreements: JvAgreement[];
  createdAt: string;
  updatedAt: string;
}

export interface DealScenarioRecord {
  id: string;
  dealId: string;
  name: string;
  color: string;
  isBaseCase: boolean;
  pricing: CommodityPricingAssumptions;
  schedule: ScheduleParams;
  capexScalar: number;
  productionScalar: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DealEconomicsRunRecord {
  id: string;
  dealId: string;
  scenarioId: string | null;
  triggeredBy: string;
  inputHash: string;
  portfolioMetrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    payoutMonths: number;
    wellCount: number;
  };
  groupMetrics: Array<{
    groupId: string;
    rank: number | null;
    metrics: {
      npv10: number;
      totalCapex: number;
      eur: number;
      roi: number;
      payoutMonths: number;
      wellCount: number;
    };
  }>;
  warnings: string[];
  createdAt: string;
}


// --- DEAL EXTENSION TYPES ---

export interface DealDifferentialProfile {
  id: string;
  dealId: string;
  groupId: string | null;
  wellId: string | null;
  name: string;
  oilDifferential: number;
  gasDifferential: number;
  nglDifferential: number;
  oilGathering: number;
  gasGathering: number;
  oilTransport: number;
  gasTransport: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ProfileType = 'type_curve' | 'capex' | 'opex' | 'ownership' | 'pricing' | 'composite';

export interface DealTypeCurvePreset {
  id: string;
  organizationId?: string | null;
  ownerUserId: string;
  scope?: ModelPresetScope;
  name: string;
  profileType: ProfileType;
  parentPresetId: string | null;
  basin: string | null;
  formation: string | null;
  operator: string | null;
  config: Record<string, unknown>;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Map Command Center types
// ---------------------------------------------------------------------------

export interface MapViewState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export type MapLayerVisibility = Record<string, boolean>;

// ---------------------------------------------------------------------------
// Spatial Data Types
// ---------------------------------------------------------------------------

export interface ViewportBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

export interface SpatialLayerFilter {
  statuses?: Well['status'][];
  operators?: string[];
  formations?: string[];
  layers?: string[];
}

export interface SpatialWellsResponse {
  wells: Well[];
  total_count: number;
  truncated: boolean;
  source: 'databricks' | 'mock';
}

export interface SpatialLayer {
  id: string;
  label: string;
  description: string;
  enabled_by_default: boolean;
}

export type SpatialDataSourceId = 'mock' | 'live';
