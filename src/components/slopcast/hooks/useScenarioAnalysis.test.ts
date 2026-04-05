import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScenarioAnalysis } from './useScenarioAnalysis';
import type { WellGroup, Well, Scenario } from '../../../types';
import {
  DEFAULT_TYPE_CURVE,
  DEFAULT_CAPEX,
  DEFAULT_COMMODITY_PRICING,
  DEFAULT_OPEX,
  DEFAULT_OWNERSHIP,
} from '../../../constants';

const makeWell = (id: string): Well => ({
  id,
  name: `Well ${id}`,
  lat: 31.9,
  lng: -102.3,
  lateralLength: 10000,
  status: 'PRODUCING',
  operator: 'Test Op',
  formation: 'Wolfcamp A',
});

const makeGroup = (name: string, wellIds: string[]): WellGroup => ({
  id: `g-${name}`,
  name,
  color: '#000',
  wellIds: new Set(wellIds),
  typeCurve: DEFAULT_TYPE_CURVE,
  capex: DEFAULT_CAPEX,
  opex: DEFAULT_OPEX,
  ownership: DEFAULT_OWNERSHIP,
});

const makeScenario = (id: string, overrides?: Partial<Scenario>): Scenario => ({
  id,
  name: id.toUpperCase(),
  color: '#fff',
  isBaseCase: false,
  pricing: { ...DEFAULT_COMMODITY_PRICING },
  schedule: { annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2025-01-01' },
  capexScalar: 1.0,
  productionScalar: 1.0,
  ...overrides,
});

const BASE_PARAMS = {
  activeScenarioId: 's-base',
  sensX: 'OIL_PRICE' as const,
  sensY: 'RIG_COUNT' as const,
};

describe('useScenarioAnalysis', () => {
  it('returns empty results for empty scenarios', () => {
    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [], wells: [], scenarios: [], ...BASE_PARAMS }),
    );
    expect(result.current.scenarioResults).toEqual([]);
    expect(result.current.cfChartData).toHaveLength(120);
    expect(result.current.cfChartData[0]).toEqual({ month: 1 });
  });

  it('computes scenarioResults sorted by NPV descending', () => {
    const wells = [makeWell('w-1')];
    const group = makeGroup('A', ['w-1']);
    const lowOil = makeScenario('s-low', { pricing: { ...DEFAULT_COMMODITY_PRICING, oilPrice: 30 } });
    const highOil = makeScenario('s-high', { pricing: { ...DEFAULT_COMMODITY_PRICING, oilPrice: 120 } });

    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [group], wells, scenarios: [lowOil, highOil], ...BASE_PARAMS }),
    );

    expect(result.current.scenarioResults).toHaveLength(2);
    expect(result.current.scenarioResults[0].scenario.id).toBe('s-high');
    expect(result.current.scenarioResults[1].scenario.id).toBe('s-low');
    expect(result.current.scenarioResults[0].metrics.npv10).toBeGreaterThan(
      result.current.scenarioResults[1].metrics.npv10,
    );
  });

  it('cfChartData has 120 entries with scenario id keys', () => {
    const wells = [makeWell('w-1')];
    const group = makeGroup('A', ['w-1']);
    const scenario = makeScenario('s-base', { isBaseCase: true });

    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [group], wells, scenarios: [scenario], ...BASE_PARAMS }),
    );

    expect(result.current.cfChartData).toHaveLength(120);
    expect(result.current.cfChartData[0].month).toBe(1);
    expect(result.current.cfChartData[119].month).toBe(120);
    expect(typeof result.current.cfChartData[0]['s-base']).toBe('number');
  });

  it('sensitivityData is a matrix', () => {
    const wells = [makeWell('w-1')];
    const group = makeGroup('A', ['w-1']);
    const scenario = makeScenario('s-base', { isBaseCase: true });

    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [group], wells, scenarios: [scenario], ...BASE_PARAMS }),
    );

    expect(result.current.sensitivityData.length).toBeGreaterThan(0);
    expect(result.current.sensitivityData[0].length).toBeGreaterThan(0);
    expect(result.current.sensitivityData[0][0]).toHaveProperty('npv');
    expect(result.current.sensitivityData[0][0]).toHaveProperty('xValue');
    expect(result.current.sensitivityData[0][0]).toHaveProperty('yValue');
  });

  it('ROI is zero when capex is zero', () => {
    const wells = [makeWell('w-1')];
    const group = makeGroup('A', ['w-1']);
    // Use a group with no capex items to get zero capex
    group.capex = { ...DEFAULT_CAPEX, items: [] };
    const scenario = makeScenario('s-base');

    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [group], wells, scenarios: [scenario], ...BASE_PARAMS }),
    );

    expect(result.current.scenarioResults[0].metrics.roi).toBe(0);
  });

  it('empty groups produce zero-value metrics', () => {
    const scenario = makeScenario('s-base');

    const { result } = renderHook(() =>
      useScenarioAnalysis({ groups: [], wells: [], scenarios: [scenario], ...BASE_PARAMS }),
    );

    const metrics = result.current.scenarioResults[0].metrics;
    expect(metrics.npv10).toBe(0);
    expect(metrics.totalCapex).toBe(0);
    expect(metrics.eur).toBe(0);
    expect(metrics.roi).toBe(0);
  });
});
