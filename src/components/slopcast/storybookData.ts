import { DEFAULT_CAPEX, DEFAULT_OWNERSHIP, DEFAULT_OPEX, DEFAULT_TYPE_CURVE } from '../../constants';
import type { DealMetrics, WellGroup } from '../../types';
import type { WorkflowStep } from './WorkflowStepper';

function createMetrics(overrides: Partial<DealMetrics>): DealMetrics {
  return {
    totalCapex: 8_400_000,
    eur: 1_240_000,
    npv10: 11_700_000,
    irr: 0.42,
    payoutMonths: 18,
    wellCount: 3,
    ...overrides,
  };
}

export function createStoryGroup(
  id: string,
  name: string,
  color: string,
  wellIds: string[],
  metrics?: Partial<DealMetrics>,
): WellGroup {
  return {
    id,
    name,
    color,
    wellIds: new Set(wellIds),
    typeCurve: {
      ...DEFAULT_TYPE_CURVE,
      segments: DEFAULT_TYPE_CURVE.segments?.map((segment) => ({ ...segment })) ?? [],
    },
    capex: {
      ...DEFAULT_CAPEX,
      items: DEFAULT_CAPEX.items.map((item) => ({ ...item })),
    },
    opex: {
      ...DEFAULT_OPEX,
      segments: DEFAULT_OPEX.segments.map((segment) => ({ ...segment })),
    },
    ownership: {
      ...DEFAULT_OWNERSHIP,
      agreements: DEFAULT_OWNERSHIP.agreements.map((agreement) => ({
        ...agreement,
        prePayout: { ...agreement.prePayout },
        postPayout: { ...agreement.postPayout },
      })),
    },
    metrics: metrics ? createMetrics(metrics) : undefined,
  };
}

export const storyGroups: WellGroup[] = [
  createStoryGroup('alpha', 'Alpha Ridge', '#4FD1C5', ['w-1', 'w-2', 'w-3'], {
    npv10: 13_400_000,
    totalCapex: 9_200_000,
    eur: 1_420_000,
    irr: 0.46,
    payoutMonths: 16,
    wellCount: 3,
  }),
  createStoryGroup('bravo', 'Bravo West', '#A78BFA', ['w-4', 'w-5'], {
    npv10: 9_800_000,
    totalCapex: 7_500_000,
    eur: 980_000,
    irr: 0.35,
    payoutMonths: 22,
    wellCount: 2,
  }),
  createStoryGroup('charlie', 'Charlie Bench', '#F59E0B', ['w-6', 'w-7', 'w-8', 'w-9'], {
    npv10: 15_600_000,
    totalCapex: 11_800_000,
    eur: 1_850_000,
    irr: 0.39,
    payoutMonths: 24,
    wellCount: 4,
  }),
];

export const storyScenarioRankings = storyGroups.map((group) => ({
  id: group.id,
  npv10: group.metrics?.npv10 ?? 0,
  roi: group.metrics && group.metrics.totalCapex > 0 ? group.metrics.npv10 / group.metrics.totalCapex : 0,
  payoutMonths: group.metrics?.payoutMonths ?? 0,
  totalCapex: group.metrics?.totalCapex ?? 0,
  wellCount: group.metrics?.wellCount ?? group.wellIds.size,
}));

export const storyWorkflowSteps: WorkflowStep[] = [
  { id: 'SETUP', label: 'Setup', status: 'COMPLETE' },
  { id: 'SELECT', label: 'Select', status: 'ACTIVE' },
  { id: 'RUN', label: 'Run', status: 'STALE' },
  { id: 'REVIEW', label: 'Review', status: 'NOT_STARTED' },
];
