import { DEFAULT_COMMODITY_PRICING } from '../../constants';
import type { CommodityPricingAssumptions, DealMetrics, MonthlyCashFlow, Scenario, WellGroup } from '../../types';

export interface ScenarioRanking {
  id: string;
  name: string;
  wellCount: number;
  npv10: number;
  totalCapex: number;
  eur: number;
  roi: number;
  payoutMonths: number;
  baseNri: number;
  baseCostInterest: number;
}

const EMPTY_METRICS: DealMetrics = {
  npv10: 0,
  totalCapex: 0,
  eur: 0,
  payoutMonths: 0,
  wellCount: 0,
};

export const selectScenarioRankings = (processedGroups: WellGroup[]): ScenarioRanking[] =>
  processedGroups
    .map((group) => {
      const metrics = group.metrics || EMPTY_METRICS;
      const totalRevenue = group.flow?.reduce((sum, flow) => sum + flow.revenue, 0) || 0;
      const totalOpex = group.flow?.reduce((sum, flow) => sum + flow.opex, 0) || 0;
      const roi = metrics.totalCapex > 0 ? (totalRevenue - totalOpex) / metrics.totalCapex : 0;
      return {
        id: group.id,
        name: group.name,
        wellCount: metrics.wellCount,
        npv10: metrics.npv10,
        totalCapex: metrics.totalCapex,
        eur: metrics.eur,
        roi,
        payoutMonths: metrics.payoutMonths,
        baseNri: group.ownership.baseNri,
        baseCostInterest: group.ownership.baseCostInterest,
      };
    })
    .sort((a, b) => {
      if (b.npv10 !== a.npv10) return b.npv10 - a.npv10;
      return b.roi - a.roi;
    });

export const selectPortfolioRoi = (aggregateFlow: MonthlyCashFlow[], aggregateMetrics: DealMetrics): number => {
  const totalRevenue = aggregateFlow.reduce((sum, flow) => sum + flow.revenue, 0);
  const totalOpex = aggregateFlow.reduce((sum, flow) => sum + flow.opex, 0);
  return aggregateMetrics.totalCapex > 0 ? (totalRevenue - totalOpex) / aggregateMetrics.totalCapex : 0;
};

const selectActivePricing = (scenarios: Scenario[], activeScenarioId: string): CommodityPricingAssumptions => {
  const baseScenario = scenarios.find((scenario) => scenario.isBaseCase) || scenarios[0];
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) || baseScenario;
  return activeScenario?.pricing || DEFAULT_COMMODITY_PRICING;
};

export const selectValidationWarnings = ({
  aggregateMetrics,
  filteredWellCount,
  selectedVisibleCount,
  scenarios,
  activeScenarioId,
  activeGroup,
}: {
  aggregateMetrics: DealMetrics;
  filteredWellCount: number;
  selectedVisibleCount: number;
  scenarios: Scenario[];
  activeScenarioId: string;
  activeGroup: WellGroup;
}): string[] => {
  const warnings: string[] = [];
  if (aggregateMetrics.wellCount === 0) warnings.push('No wells assigned to a scenario yet.');
  if (filteredWellCount === 0) warnings.push('Current filters exclude all wells.');
  if (selectedVisibleCount === 0) warnings.push('Step 2 incomplete: no visible wells are currently selected in the basin map.');

  const activePricing = selectActivePricing(scenarios, activeScenarioId);
  if (activePricing.oilPrice <= 0 || activePricing.gasPrice < 0) warnings.push('Scenario pricing inputs are incomplete or invalid.');
  if (activeGroup.ownership.baseNri <= 0 || activeGroup.ownership.baseNri > 1) warnings.push('Base NRI is invalid in the active group.');
  if (activeGroup.ownership.baseCostInterest < 0 || activeGroup.ownership.baseCostInterest > 1) warnings.push('Base cost interest is invalid in the active group.');
  if ((activeGroup.opex.segments || []).length === 0) warnings.push('OPEX segments are missing for the active group.');
  if (activeGroup.capex.items.length === 0) warnings.push('CAPEX items are missing for the active group.');
  return warnings;
};
