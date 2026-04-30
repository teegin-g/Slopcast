import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE } from '../../constants';
import type { Scenario, WellGroup } from '../../types';
import { selectPortfolioRoi, selectScenarioRankings, selectValidationWarnings } from './selectors';

const makeGroup = (id: string, npv10 = 0, totalCapex = 100): WellGroup => ({
  id,
  name: id,
  color: '#fff',
  wellIds: new Set(['a']),
  typeCurve: { ...DEFAULT_TYPE_CURVE },
  capex: { ...DEFAULT_CAPEX, items: DEFAULT_CAPEX.items.map((item) => ({ ...item })) },
  opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map((segment) => ({ ...segment })) },
  ownership: { ...DEFAULT_OWNERSHIP, agreements: [] },
  metrics: {
    npv10,
    totalCapex,
    eur: 1000,
    payoutMonths: 10,
    wellCount: 1,
  },
  flow: [
    {
      month: 1,
      date: 'Month 1',
      oilProduction: 0,
      gasProduction: 0,
      revenue: 200,
      capex: totalCapex,
      opex: 50,
      netCashFlow: 50,
      cumulativeCashFlow: 50,
    },
  ],
});

const scenarios: Scenario[] = [
  {
    id: 'base',
    name: 'Base',
    color: '#fff',
    isBaseCase: true,
    pricing: { ...DEFAULT_COMMODITY_PRICING },
    schedule: { annualRigs: [1], drillDurationDays: 20, stimDurationDays: 10, rigStartDate: '2026-01-01' },
    capexScalar: 1,
    productionScalar: 1,
  },
];

describe('workspace selectors', () => {
  it('ranks groups by NPV then ROI', () => {
    const rankings = selectScenarioRankings([
      makeGroup('low', 10, 100),
      makeGroup('high', 20, 200),
      makeGroup('also-high', 20, 100),
    ]);

    expect(rankings.map((row) => row.id)).toEqual(['also-high', 'high', 'low']);
  });

  it('computes portfolio ROI from aggregate flow', () => {
    const roi = selectPortfolioRoi(
      [
        { month: 1, date: 'Month 1', oilProduction: 0, gasProduction: 0, revenue: 300, capex: 0, opex: 50, netCashFlow: 250, cumulativeCashFlow: 250 },
      ],
      { npv10: 0, totalCapex: 500, eur: 0, payoutMonths: 0, wellCount: 1 },
    );

    expect(roi).toBe(0.5);
  });

  it('returns validation warnings for incomplete inputs', () => {
    const activeGroup = {
      ...makeGroup('g-1'),
      ownership: { ...DEFAULT_OWNERSHIP, baseNri: 1.4, baseCostInterest: -0.1, agreements: [] },
      opex: { segments: [] },
      capex: { ...DEFAULT_CAPEX, items: [] },
    };
    const warnings = selectValidationWarnings({
      aggregateMetrics: { npv10: 0, totalCapex: 0, eur: 0, payoutMonths: 0, wellCount: 0 },
      filteredWellCount: 0,
      selectedVisibleCount: 0,
      scenarios,
      activeScenarioId: 'base',
      activeGroup,
    });

    expect(warnings).toContain('No wells assigned to a scenario yet.');
    expect(warnings).toContain('Current filters exclude all wells.');
    expect(warnings).toContain('Base NRI is invalid in the active group.');
    expect(warnings).toContain('OPEX segments are missing for the active group.');
    expect(warnings).toContain('CAPEX items are missing for the active group.');
  });
});
