import type { CommodityPricingAssumptions, DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import type { Phase1WorkflowId } from '../workflowModel';

export type EconomicsModule = 'PRODUCTION' | 'PRICING' | 'OPEX' | 'TAXES' | 'OWNERSHIP' | 'CAPEX' | 'SPACING' | 'SCHEDULE' | 'RISK';

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

export const PDP_ECONOMICS_MODULES: EconomicsModuleMeta[] = [
  { id: 'PRODUCTION', label: 'PDP Forecast', shortLabel: 'PDP Forecast', eyebrow: 'History-driven decline from producing wells', accent: 'cyan' },
  { id: 'PRICING', label: 'Pricing', shortLabel: 'Pricing', eyebrow: 'Commodity prices and differentials', accent: 'green' },
  { id: 'OPEX', label: 'LOE Forecast', shortLabel: 'LOE', eyebrow: 'Fixed and variable LOE from production history', accent: 'amber' },
  { id: 'OWNERSHIP', label: 'Ownership', shortLabel: 'Ownership', eyebrow: 'WI, NRI, burdens, and overrides', accent: 'mint' },
  { id: 'TAXES', label: 'Taxes', shortLabel: 'Taxes', eyebrow: 'Severance, ad valorem, and income tax', accent: 'red' },
  { id: 'CAPEX', label: 'Maintenance Capital', shortLabel: 'Maint. Capex', eyebrow: 'Optional workover or sustaining capital', accent: 'violet' },
];

export const UNDEVELOPED_ECONOMICS_MODULES: EconomicsModuleMeta[] = [
  { id: 'PRODUCTION', label: 'Type Curve', shortLabel: 'Type Curve', eyebrow: 'Analog curve and production profile', accent: 'cyan' },
  { id: 'SPACING', label: 'Spacing & Inventory', shortLabel: 'Spacing', eyebrow: 'DSUs, planned wells, benches, and lateral length', accent: 'mint' },
  { id: 'CAPEX', label: 'CAPEX', shortLabel: 'CAPEX', eyebrow: 'D&C, facilities, equipment, and inflation', accent: 'violet' },
  { id: 'SCHEDULE', label: 'Schedule', shortLabel: 'Schedule', eyebrow: 'Rig count, phase sequence, and first production timing', accent: 'green' },
  { id: 'OPEX', label: 'LOE', shortLabel: 'LOE', eyebrow: 'Post-first-production fixed and variable costs', accent: 'amber' },
  { id: 'OWNERSHIP', label: 'Ownership', shortLabel: 'Ownership', eyebrow: 'Working interest and revenue split', accent: 'mint' },
  { id: 'TAXES', label: 'Taxes', shortLabel: 'Taxes', eyebrow: 'Tax assumptions and impact', accent: 'red' },
  { id: 'RISK', label: 'Risk', shortLabel: 'Risk', eyebrow: 'PUD/probable risk and parent-child degradation', accent: 'red' },
];

export const getEconomicsModulesForWorkflow = (workflow?: Phase1WorkflowId) => {
  if (workflow === 'UNDEVELOPED') return UNDEVELOPED_ECONOMICS_MODULES;
  if (workflow === 'PDP') return PDP_ECONOMICS_MODULES;
  return ECONOMICS_MODULES;
};

export const getEconomicsModuleMeta = (module: EconomicsModule, workflow?: Phase1WorkflowId) =>
  getEconomicsModulesForWorkflow(workflow).find((item) => item.id === module)
    ?? ECONOMICS_MODULES.find((item) => item.id === module)
    ?? ECONOMICS_MODULES[0];

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
