import {
  Well,
  TypeCurveParams,
  CapexAssumptions,
  CommodityPricingAssumptions,
  OpexAssumptions,
  OwnershipAssumptions,
  MonthlyCashFlow,
  DealMetrics,
  WellGroup,
  ScheduleParams,
  SensitivityVariable,
  SensitivityMatrixResult,
} from '../types';
import * as tsCalc from '../utils/economics';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type EngineId = 'typescript' | 'python';
export const ECONOMICS_ENGINE_VERSION = 'parity-v1';

export interface EconomicsEngineResult {
  flow: MonthlyCashFlow[];
  metrics: DealMetrics;
}

export interface EconomicsEngine {
  id: EngineId;
  label: string;

  calculateEconomics(
    wells: Well[],
    typeCurve: TypeCurveParams,
    capex: CapexAssumptions,
    pricing: CommodityPricingAssumptions,
    opex: OpexAssumptions,
    ownership: OwnershipAssumptions,
    scalars?: { capex: number; production: number },
    scheduleOverride?: ScheduleParams,
  ): Promise<EconomicsEngineResult>;

  aggregateEconomics(groups: WellGroup[]): Promise<EconomicsEngineResult>;

  generateSensitivityMatrix(
    baseGroups: WellGroup[],
    wells: Well[],
    basePricing: CommodityPricingAssumptions,
    xVar: SensitivityVariable,
    xSteps: number[],
    yVar: SensitivityVariable,
    ySteps: number[],
  ): Promise<SensitivityMatrixResult[][]>;
}

// ---------------------------------------------------------------------------
// TypeScript (browser) engine – thin async wrapper around utils/economics.ts
// ---------------------------------------------------------------------------

const tsEngine: EconomicsEngine = {
  id: 'typescript',
  label: 'TypeScript (Browser)',

  async calculateEconomics(wells, typeCurve, capex, pricing, opex, ownership, scalars, scheduleOverride) {
    return tsCalc.calculateEconomics(wells, typeCurve, capex, pricing, opex, ownership, scalars, scheduleOverride);
  },

  async aggregateEconomics(groups) {
    return tsCalc.aggregateEconomics(groups);
  },

  async generateSensitivityMatrix(baseGroups, wells, basePricing, xVar, xSteps, yVar, ySteps) {
    return tsCalc.generateSensitivityMatrix(baseGroups, wells, basePricing, xVar, xSteps, yVar, ySteps);
  },
};

// ---------------------------------------------------------------------------
// Python (FastAPI) engine – proxied through Next/Vite /api rewrite
// ---------------------------------------------------------------------------

const PYTHON_API_BASE = '/api';

async function pyFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PYTHON_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Python engine error (${res.status}): ${text}`);
  }
  return res.json();
}

const pyEngine: EconomicsEngine = {
  id: 'python',
  label: 'Python (FastAPI)',

  async calculateEconomics(wells, typeCurve, capex, pricing, opex, ownership, scalars, scheduleOverride) {
    return pyFetch<EconomicsEngineResult>('/economics/calculate', {
      wells: wells.map(w => ({ ...w })),
      typeCurve,
      capex,
      pricing,
      opex,
      ownership,
      scalars: scalars ?? { capex: 1, production: 1 },
      scheduleOverride: scheduleOverride ?? null,
    });
  },

  async aggregateEconomics(groups) {
    const pyGroups = groups.map(g => ({
      ...g,
      wellIds: Array.from(g.wellIds),
      pricing: { oilPrice: 75, gasPrice: 3.25, oilDifferential: 2.5, gasDifferential: 0.35 },
    }));
    return pyFetch<EconomicsEngineResult>('/economics/aggregate', { groups: pyGroups });
  },

  async generateSensitivityMatrix(baseGroups, wells, basePricing, xVar, xSteps, yVar, ySteps) {
    const pyGroups = baseGroups.map(g => ({
      ...g,
      wellIds: Array.from(g.wellIds),
      pricing: basePricing,
    }));
    return pyFetch<SensitivityMatrixResult[][]>('/sensitivity/matrix', {
      baseGroups: pyGroups,
      wells,
      xVar,
      xSteps,
      yVar,
      ySteps,
    });
  },
};

// ---------------------------------------------------------------------------
// Engine registry & persistence
// ---------------------------------------------------------------------------

const engines: Record<EngineId, EconomicsEngine> = {
  typescript: tsEngine,
  python: pyEngine,
};

export { getEngineId as getStoredEngineId, setEngineId as setStoredEngineId } from './storage/workspacePreferences';
import { getEngineId } from './storage/workspacePreferences';

export function getEngine(id?: EngineId): EconomicsEngine {
  return engines[id ?? getEngineId()];
}

export function getAllEngines(): EconomicsEngine[] {
  return Object.values(engines);
}
