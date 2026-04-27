import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE } from '../../../constants';
import type { MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import {
  buildWhatChanged,
  getRealizedPricing,
  summarizeCapex,
  summarizeOpex,
  summarizeOwnership,
  summarizeProduction,
  summarizeTaxes,
} from './derived';

const flow: MonthlyCashFlow[] = [
  { month: 1, date: 'M1', oilProduction: 1000, gasProduction: 500, revenue: 70_000, capex: 2_000_000, opex: 10_000, netCashFlow: -1_940_000, cumulativeCashFlow: -1_940_000 },
  { month: 2, date: 'M2', oilProduction: 800, gasProduction: 400, revenue: 56_000, capex: 0, opex: 8_000, netCashFlow: 48_000, cumulativeCashFlow: -1_892_000 },
  { month: 3, date: 'M3', oilProduction: 700, gasProduction: 350, revenue: 49_000, capex: 0, opex: 7_000, netCashFlow: 42_000, cumulativeCashFlow: -1_850_000 },
];

const group: WellGroup = {
  id: 'g-1',
  name: 'Test Group',
  color: '#22d3ee',
  wellIds: new Set(['w-1']),
  typeCurve: { ...DEFAULT_TYPE_CURVE },
  capex: { ...DEFAULT_CAPEX, items: DEFAULT_CAPEX.items.map((item) => ({ ...item })) },
  opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map((segment) => ({ ...segment })) },
  ownership: { ...DEFAULT_OWNERSHIP, agreements: [] },
  flow,
  metrics: { totalCapex: 2_000_000, eur: 2500, npv10: 1_500_000, payoutMonths: 24, wellCount: 1 },
};

const wells: Well[] = [
  { id: 'w-1', name: 'Well 1', lat: 0, lng: 0, lateralLength: 10_000, status: 'PRODUCING', operator: 'Ops', formation: 'Wolfcamp' },
];

const baseScenario: Scenario = {
  id: 'base',
  name: 'Base',
  color: '#22d3ee',
  isBaseCase: true,
  pricing: { ...DEFAULT_COMMODITY_PRICING },
  schedule: { annualRigs: [1], drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2026-01-01' },
  capexScalar: 1,
  productionScalar: 1,
};

describe('economics derived helpers', () => {
  it('summarizes production totals and peak month', () => {
    const summary = summarizeProduction(group);
    expect(summary.eur).toBe(2500);
    expect(summary.totalGas).toBe(1250);
    expect(summary.peakMonth).toBe(1);
  });

  it('computes realized oil and gas pricing', () => {
    expect(getRealizedPricing(DEFAULT_COMMODITY_PRICING)).toEqual({
      oil: 72.5,
      gas: 2.9,
      oilDifferential: 2.5,
      gasDifferential: 0.35,
    });
  });

  it('summarizes OPEX from cash flow and assumptions', () => {
    const summary = summarizeOpex(group);
    expect(summary.totalOpex).toBe(25_000);
    expect(summary.loePerBoe).toBe(10);
    expect(summary.segments).toHaveLength(1);
  });

  it('computes tax burden without mutating group state', () => {
    const summary = summarizeTaxes(group);
    expect(summary.totalTax).toBeGreaterThan(0);
    expect(summary.effectiveRate).toBeGreaterThan(0);
    expect(group.flow?.[0].severanceTax).toBeUndefined();
  });

  it('summarizes ownership split checks', () => {
    const summary = summarizeOwnership(group);
    expect(summary.baseNri).toBe(DEFAULT_OWNERSHIP.baseNri);
    expect(summary.splitCheck).toBeCloseTo(1);
  });

  it('summarizes CAPEX categories and timing', () => {
    const summary = summarizeCapex(group, wells);
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.categories.length).toBeGreaterThan(1);
    expect(summary.timing.length).toBe(DEFAULT_CAPEX.items.length);
  });

  it('builds scenario change summaries from active vs base scenario', () => {
    const activeScenario: Scenario = {
      ...baseScenario,
      id: 'upside',
      isBaseCase: false,
      pricing: { ...baseScenario.pricing, oilPrice: 85 },
      capexScalar: 0.9,
    };
    const changes = buildWhatChanged({ activeGroup: group, wells, activeScenario, baseScenario, aggregateFlow: flow, aggregateMetrics: group.metrics! });
    expect(changes.map((change) => change.label)).toContain('Oil benchmark');
    expect(changes.map((change) => change.label)).toContain('CAPEX scalar');
  });
});
