export type Phase1WorkflowId = 'PDP' | 'UNDEVELOPED' | 'SCENARIOS';
export type AssetWorkflowId = Exclude<Phase1WorkflowId, 'SCENARIOS'>;
export type Phase1StageId = 'UNIVERSE' | 'WELLS_INVENTORY' | 'FORECAST_ECONOMICS' | 'REVIEW';
export type WorkflowStageSurface = 'MOCK' | 'WELLS' | 'ECONOMICS' | 'SCENARIOS';

export interface Phase1PrimaryNavItem {
  id: Phase1WorkflowId;
  label: string;
  eyebrow: string;
}

export interface Phase1Stage {
  id: Phase1StageId;
  label: string;
  description: string;
}

export const phase1PrimaryNav: Phase1PrimaryNavItem[] = [
  { id: 'PDP', label: 'PDP', eyebrow: 'Producing base' },
  { id: 'UNDEVELOPED', label: 'Undeveloped', eyebrow: 'Inventory build' },
  { id: 'SCENARIOS', label: 'Scenarios', eyebrow: 'Global sensitivities' },
];

const sharedStages: Phase1Stage[] = [
  {
    id: 'UNIVERSE',
    label: 'Universe',
    description: 'Define the working asset dataset, filters, data coverage, and saved universe preset.',
  },
  {
    id: 'WELLS_INVENTORY',
    label: 'Wells / Inventory',
    description: 'Select, inspect, and group wells or planned inventory on the existing map workspace.',
  },
  {
    id: 'FORECAST_ECONOMICS',
    label: 'Forecast & Economics',
    description: 'Assign forecast, assumptions, and economics inputs using the existing economics surface.',
  },
  {
    id: 'REVIEW',
    label: 'Review',
    description: 'Check readiness, risk flags, and scenario handoff status before global sensitivities.',
  },
];

export const phase1WorkflowStages: Record<AssetWorkflowId, Phase1Stage[]> = {
  PDP: sharedStages,
  UNDEVELOPED: sharedStages,
};

export function isAssetWorkflow(workflow: Phase1WorkflowId): workflow is AssetWorkflowId {
  return workflow !== 'SCENARIOS';
}

export function getWorkflowStageSurface(
  workflow: AssetWorkflowId,
  stage: Phase1StageId,
): WorkflowStageSurface {
  if (stage === 'WELLS_INVENTORY') return 'WELLS';
  if (stage === 'FORECAST_ECONOMICS') return 'ECONOMICS';
  return 'MOCK';
}
