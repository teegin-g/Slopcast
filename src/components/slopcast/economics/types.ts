import type { CommodityPricingAssumptions, DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import type { Phase1WorkflowId } from '../workflowModel';

export type EconomicsModule = 'PRODUCTION' | 'PRICING' | 'OPEX' | 'TAXES' | 'OWNERSHIP' | 'CAPEX';

export type EconomicsAccent = 'cyan' | 'green' | 'amber' | 'red' | 'mint' | 'violet';

export interface EconomicsModuleMeta {
  id: EconomicsModule;
  label: string;
  shortLabel: string;
  eyebrow: string;
  accent: EconomicsAccent;
}

export const ECONOMICS_MODULES: EconomicsModuleMeta[] = [
  { id: 'PRODUCTION', label: 'Production', shortLabel: 'Production', eyebrow: 'Forecast profile and decline', accent: 'cyan' },
  { id: 'PRICING', label: 'Pricing', shortLabel: 'Pricing', eyebrow: 'Price assumptions and netbacks', accent: 'green' },
  { id: 'OPEX', label: 'OPEX & LOE', shortLabel: 'OPEX', eyebrow: 'Operating expenses and cost structure', accent: 'amber' },
  { id: 'TAXES', label: 'Taxes', shortLabel: 'Taxes', eyebrow: 'Tax assumptions and impact', accent: 'red' },
  { id: 'OWNERSHIP', label: 'Ownership', shortLabel: 'Ownership', eyebrow: 'Working interest and revenue split', accent: 'mint' },
  { id: 'CAPEX', label: 'CAPEX & Investment', shortLabel: 'CAPEX', eyebrow: 'Capital investment and payout', accent: 'violet' },
];

export const getEconomicsModuleMeta = (module: EconomicsModule) =>
  ECONOMICS_MODULES.find((item) => item.id === module) ?? ECONOMICS_MODULES[0];

export interface EconomicsModuleProps {
  isClassic: boolean;
  activeWorkflow?: Phase1WorkflowId;
  activeGroup: WellGroup;
  groups: WellGroup[];
  wells: Well[];
  scenarios: Scenario[];
  activeScenario: Scenario;
  baseScenario: Scenario;
  aggregateFlow: MonthlyCashFlow[];
  aggregateMetrics: DealMetrics;
  breakevenOilPrice?: number | null;
  onUpdateGroup: (group: WellGroup) => void;
  onMarkDirty: () => void;
}

export interface EconomicsContext {
  activeGroup: WellGroup;
  wells: Well[];
  activeScenario: Scenario;
  baseScenario: Scenario;
  aggregateFlow: MonthlyCashFlow[];
  aggregateMetrics: DealMetrics;
}

export type PricingDelta = keyof Pick<CommodityPricingAssumptions, 'oilPrice' | 'gasPrice' | 'oilDifferential' | 'gasDifferential'>;
