import type { CapexItem, OpexSegment, JvAgreement } from './economics';
import type { CommodityPricingAssumptions } from './economics';
import type { ScheduleParams } from './scenarios';
import type { ModelPresetScope } from './integrations';

export type DealStatus = 'draft' | 'active' | 'closed' | 'archived';
export type DealWellType = 'developed' | 'undeveloped';
export type ProfileType = 'type_curve' | 'capex' | 'opex' | 'ownership' | 'pricing' | 'composite';

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
