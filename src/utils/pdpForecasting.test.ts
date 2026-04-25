import { describe, expect, it } from 'vitest';
import { DEFAULT_CAPEX, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, MOCK_WELLS } from '../constants';
import type { WellGroup } from '../types';
import {
  buildMockProductionHistory,
  buildProductionHistoryMap,
  getPdpReadiness,
  summarizePdpGroup,
  summarizeProductionUniverse,
} from './pdpForecasting';

const makeGroup = (wellIds: string[], overrides: Partial<WellGroup> = {}): WellGroup => ({
  id: 'g-test',
  name: 'Test PDP Group',
  color: '#22d3ee',
  wellIds: new Set(wellIds),
  typeCurve: { ...DEFAULT_TYPE_CURVE },
  capex: { ...DEFAULT_CAPEX },
  opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(segment => ({ ...segment })) },
  ownership: { ...DEFAULT_OWNERSHIP, agreements: [] },
  ...overrides,
});

describe('PDP forecasting adapter', () => {
  it('loads deterministic production history for producing wells', () => {
    const producing = MOCK_WELLS.find(well => well.status === 'PRODUCING')!;
    const history = buildMockProductionHistory(producing);

    expect(history.status).not.toBe('MISSING');
    expect(history.history.length).toBeGreaterThan(0);
    expect(history.lastProductionDate).toBeTruthy();
    expect(history.streams).toContain('OIL');
  });

  it('marks non-producing wells as missing history', () => {
    const duc = MOCK_WELLS.find(well => well.status !== 'PRODUCING')!;
    const history = buildMockProductionHistory(duc);

    expect(history.status).toBe('MISSING');
    expect(history.qualityFlags).toContain('NO_HISTORY');
  });

  it('summarizes group forecast and readiness', () => {
    const wells = MOCK_WELLS.slice(0, 6);
    const historyByWellId = buildProductionHistoryMap(wells);
    const group = makeGroup(wells.map(well => well.id), { dataQualityAcknowledged: true });
    const summary = summarizePdpGroup(group, wells, historyByWellId);
    const ready = getPdpReadiness([{ ...group, metrics: { totalCapex: 1, eur: 1, npv10: 1, irr: 0, payoutMonths: 1, wellCount: 1 } }], [summary]);

    expect(summary.producingWellCount).toBeGreaterThan(0);
    expect(summary.forecastGenerated).toBe(true);
    expect(summary.opexForecastAssigned).toBe(true);
    expect(ready.productionDataLoaded).toBe(true);
    expect(ready.forecastsGenerated).toBe(true);
    expect(ready.opexForecastAssigned).toBe(true);
  });

  it('summarizes production universe coverage', () => {
    const wells = MOCK_WELLS.slice(0, 12);
    const summary = summarizeProductionUniverse(wells, buildProductionHistoryMap(wells));

    expect(summary.producingWellCount).toBeGreaterThan(0);
    expect(summary.coveragePct).toBeGreaterThan(0);
    expect(summary.loadedWellCount + summary.partialWellCount + summary.missingWellCount).toBe(summary.producingWellCount);
  });
});
