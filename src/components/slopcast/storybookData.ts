import { DEFAULT_CAPEX, DEFAULT_OWNERSHIP, DEFAULT_OPEX, DEFAULT_TYPE_CURVE } from '../../constants';
import type { DealMetrics, MonthlyCashFlow, WellGroup } from '../../types';
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

export const storyDealMetrics: DealMetrics = createMetrics({
  npv10: 13_400_000,
  totalCapex: 9_200_000,
  eur: 1_420_000,
  irr: 0.46,
  payoutMonths: 16,
  wellCount: 3,
});

const storyNetCashFlowSeries = [
  -2_300_000,
  -1_700_000,
  -950_000,
  -180_000,
  320_000,
  890_000,
  1_150_000,
  1_260_000,
  1_340_000,
  1_210_000,
  1_050_000,
  940_000,
  860_000,
  740_000,
  620_000,
  520_000,
  430_000,
  360_000,
];

export const storyAggregateFlow: MonthlyCashFlow[] = storyNetCashFlowSeries.map((netCashFlow, index) => {
  const month = index + 1;
  const cumulativeCashFlow = storyNetCashFlowSeries
    .slice(0, month)
    .reduce((runningTotal, value) => runningTotal + value, 0);

  return {
    month,
    date: `2026-${String(month).padStart(2, '0')}-01`,
    oilProduction: Math.max(0, 18_000 - index * 680),
    gasProduction: Math.max(0, 11_500 - index * 420),
    revenue: Math.max(0, 2_450_000 - index * 82_000),
    capex: month <= 4 ? Math.max(0, 2_900_000 - index * 650_000) : 0,
    opex: 180_000 + index * 8_000,
    netCashFlow,
    cumulativeCashFlow,
  };
});

export const storyWorkflowSteps: WorkflowStep[] = [
  { id: 'SETUP', label: 'Setup', status: 'COMPLETE' },
  { id: 'SELECT', label: 'Select', status: 'ACTIVE' },
  { id: 'RUN', label: 'Run', status: 'STALE' },
  { id: 'REVIEW', label: 'Review', status: 'NOT_STARTED' },
];
