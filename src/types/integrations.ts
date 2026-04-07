import type { TypeCurveParams, CapexAssumptions, OpexAssumptions, OwnershipAssumptions } from './economics';
import type { CommodityPricingAssumptions } from './economics';
import type { ScheduleParams } from './scenarios';
import type { Well } from './wells';

export type ProjectMemberRole = 'owner' | 'editor' | 'viewer';
export type OrganizationRole = 'org_owner' | 'org_admin' | 'org_member';
export type ProjectKind = 'portfolio_model' | 'deal_evaluation';
export type ProjectVersionKind = 'checkpoint' | 'pre_run' | 'published' | 'migration';
export type ProjectArtifactType = 'memo' | 'report' | 'export' | 'attachment';
export type ModelPresetScope = 'user' | 'organization';

export interface ProjectUiState {
  designWorkspace?: 'WELLS' | 'ECONOMICS';
  economicsResultsTab?: 'OVERVIEW' | 'CASH_FLOW' | 'RESERVES';
  operatorFilter?: string | string[];
  formationFilter?: string | string[];
  statusFilter?: string | string[];
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
