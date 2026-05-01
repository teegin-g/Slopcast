import type {
  CapexAssumptions,
  CommodityPricingAssumptions,
  DealMetrics,
  OpexAssumptions,
  OwnershipAssumptions,
  ProjectUiState,
  ScheduleParams,
  TypeCurveParams,
} from '../types';

export const unwrapJsonbContract = <T>(value: unknown, label = 'jsonb contract'): T => {
  if (value == null) {
    return {} as T;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected object JSONB payload.`);
  }
  const next = { ...(value as Record<string, unknown>) };
  delete next.schema_version;
  delete next.validated_at;
  delete next.validator_name;
  return next as T;
};

export const parseProjectUiState = (value: unknown): ProjectUiState =>
  unwrapJsonbContract<ProjectUiState>(value, 'project ui_state_jsonb');

export const parseProjectMetadata = (value: unknown): Record<string, unknown> =>
  unwrapJsonbContract<Record<string, unknown>>(value, 'project metadata_jsonb');

export const parseGroupConfig = (value: unknown) =>
  unwrapJsonbContract<{
    typeCurve?: TypeCurveParams;
    capex?: CapexAssumptions;
    opex?: OpexAssumptions;
    ownership?: OwnershipAssumptions;
  }>(value, 'project group config_jsonb');

export const parseScenarioScalars = (value: unknown): { capexScalar?: number; productionScalar?: number } =>
  unwrapJsonbContract<{ capexScalar?: number; productionScalar?: number }>(value, 'project scenario scalar_jsonb');

export const parsePricing = (value: unknown): CommodityPricingAssumptions =>
  unwrapJsonbContract<CommodityPricingAssumptions>(value, 'project scenario pricing_jsonb');

export const parseSchedule = (value: unknown): ScheduleParams =>
  unwrapJsonbContract<ScheduleParams>(value, 'project scenario schedule_jsonb');

export const parseRunMetrics = (value: unknown): EconomicsRunRecordMetrics =>
  unwrapJsonbContract<EconomicsRunRecordMetrics>(value, 'economics run portfolio_metrics');

export type EconomicsRunRecordMetrics = Pick<DealMetrics, 'npv10' | 'totalCapex' | 'eur' | 'payoutMonths' | 'wellCount'>;
