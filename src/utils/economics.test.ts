import { describe, it, expect } from 'vitest';
import {
  calculateEconomics,
  applyTaxLayer,
  applyDebtLayer,
  applyReservesRisk,
  aggregateEconomics,
} from './economics';
import {
  DEFAULT_TYPE_CURVE,
  DEFAULT_CAPEX,
  DEFAULT_COMMODITY_PRICING,
  DEFAULT_OPEX,
  DEFAULT_OWNERSHIP,
  MOCK_WELLS,
} from '../constants';
import {
  DEFAULT_TAX_ASSUMPTIONS,
  DEFAULT_DEBT_ASSUMPTIONS,
  TAX_PRESETS,
} from '../types';
import type { Well, WellGroup, DebtAssumptions } from '../types';

// Small test well sets
const TEST_WELLS: Well[] = MOCK_WELLS.slice(0, 3);
const SINGLE_WELL: Well[] = [MOCK_WELLS[0]];

// ─── calculateEconomics ────────────────────────────────────────────

describe('calculateEconomics', () => {
  it('returns zeros for empty wells', () => {
    const { flow, metrics } = calculateEconomics(
      [],
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    expect(flow).toHaveLength(0);
    expect(metrics.totalCapex).toBe(0);
    expect(metrics.eur).toBe(0);
    expect(metrics.npv10).toBe(0);
    expect(metrics.irr).toBe(0);
    expect(metrics.payoutMonths).toBe(0);
    expect(metrics.wellCount).toBe(0);
  });

  it('produces positive NPV for a single well with defaults', () => {
    const { flow, metrics } = calculateEconomics(
      SINGLE_WELL,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    expect(flow).toHaveLength(120);
    expect(metrics.wellCount).toBe(1);
    expect(metrics.totalCapex).toBeGreaterThan(0);
    expect(metrics.eur).toBeGreaterThan(0);
    expect(metrics.npv10).toBeGreaterThan(0);
    expect(metrics.payoutMonths).toBeGreaterThan(0);
    expect(metrics.payoutMonths).toBeLessThanOrEqual(120);
  });

  it('capex scalar affects totalCapex proportionally', () => {
    const base = calculateEconomics(
      TEST_WELLS,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
      { capex: 1, production: 1 },
    );

    const doubled = calculateEconomics(
      TEST_WELLS,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
      { capex: 2, production: 1 },
    );

    // With 100% cost interest and no JV, doubling capex scalar should double totalCapex
    expect(doubled.metrics.totalCapex).toBeCloseTo(base.metrics.totalCapex * 2, 0);
  });

  it('production scalar affects EUR proportionally', () => {
    const base = calculateEconomics(
      SINGLE_WELL,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
      { capex: 1, production: 1 },
    );

    const boosted = calculateEconomics(
      SINGLE_WELL,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
      { capex: 1, production: 1.5 },
    );

    // EUR should scale with production scalar
    expect(boosted.metrics.eur).toBeCloseTo(base.metrics.eur * 1.5, 0);
  });

  it('more wells produce higher EUR and totalCapex', () => {
    const oneWell = calculateEconomics(
      SINGLE_WELL,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    const threeWells = calculateEconomics(
      TEST_WELLS,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    expect(threeWells.metrics.wellCount).toBe(3);
    expect(threeWells.metrics.totalCapex).toBeGreaterThan(oneWell.metrics.totalCapex);
    expect(threeWells.metrics.eur).toBeGreaterThan(oneWell.metrics.eur);
  });

  it('cumulative cash flow starts negative (capex outlay) and recovers', () => {
    const { flow } = calculateEconomics(
      SINGLE_WELL,
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    // First month should have negative cumulative (capex outlay)
    expect(flow[0].cumulativeCashFlow).toBeLessThan(0);
    // Last month should be positive (recovered)
    expect(flow[flow.length - 1].cumulativeCashFlow).toBeGreaterThan(0);
  });
});

// ─── applyTaxLayer ─────────────────────────────────────────────────

describe('applyTaxLayer', () => {
  const baseResult = calculateEconomics(
    TEST_WELLS,
    DEFAULT_TYPE_CURVE,
    DEFAULT_CAPEX,
    DEFAULT_COMMODITY_PRICING,
    DEFAULT_OPEX,
    DEFAULT_OWNERSHIP,
  );

  it('severance tax reduces after-tax NPV below pre-tax NPV', () => {
    const { metrics } = applyTaxLayer(baseResult.flow, baseResult.metrics, DEFAULT_TAX_ASSUMPTIONS);

    expect(metrics.afterTaxNpv10).toBeDefined();
    expect(metrics.afterTaxNpv10!).toBeLessThan(metrics.npv10);
    expect(metrics.afterTaxNpv10!).toBeGreaterThan(0);
  });

  it('Texas preset produces reasonable after-tax metrics', () => {
    const texasTax = TAX_PRESETS.Texas;
    const { flow, metrics } = applyTaxLayer(baseResult.flow, baseResult.metrics, texasTax);

    // After-tax payout should be defined and >= pre-tax payout
    expect(metrics.afterTaxPayoutMonths).toBeDefined();
    expect(metrics.afterTaxPayoutMonths!).toBeGreaterThanOrEqual(baseResult.metrics.payoutMonths);

    // Flow should have tax fields populated
    expect(flow[5].severanceTax).toBeDefined();
    expect(flow[5].severanceTax!).toBeGreaterThanOrEqual(0);
    expect(flow[5].afterTaxCashFlow).toBeDefined();
  });

  it('zero tax rates return after-tax NPV equal to pre-tax NPV', () => {
    const zeroTax = {
      severanceTaxPct: 0,
      adValoremTaxPct: 0,
      federalTaxRate: 0,
      depletionAllowancePct: 0,
      stateTaxRate: 0,
    };
    const { metrics } = applyTaxLayer(baseResult.flow, baseResult.metrics, zeroTax);

    expect(metrics.afterTaxNpv10).toBeCloseTo(metrics.npv10, 2);
  });
});

// ─── applyDebtLayer ────────────────────────────────────────────────

describe('applyDebtLayer', () => {
  const baseResult = calculateEconomics(
    TEST_WELLS,
    DEFAULT_TYPE_CURVE,
    DEFAULT_CAPEX,
    DEFAULT_COMMODITY_PRICING,
    DEFAULT_OPEX,
    DEFAULT_OWNERSHIP,
  );

  it('disabled debt returns input unchanged', () => {
    const { flow, metrics } = applyDebtLayer(
      baseResult.flow,
      baseResult.metrics,
      DEFAULT_DEBT_ASSUMPTIONS,
    );

    // DEFAULT_DEBT_ASSUMPTIONS has enabled: false
    expect(flow).toBe(baseResult.flow); // same reference
    expect(metrics).toBe(baseResult.metrics);
  });

  it('enabled debt reduces levered NPV vs unlevered', () => {
    const enabledDebt: DebtAssumptions = {
      ...DEFAULT_DEBT_ASSUMPTIONS,
      enabled: true,
      termLoanAmount: 5_000_000,
    };

    const { metrics } = applyDebtLayer(baseResult.flow, baseResult.metrics, enabledDebt);

    expect(metrics.leveredNpv10).toBeDefined();
    expect(metrics.leveredNpv10!).toBeLessThan(baseResult.metrics.npv10);
    expect(metrics.dscr).toBeDefined();
    expect(metrics.dscr!).toBeGreaterThan(0);
  });

  it('debt layer populates outstanding debt fields on flow', () => {
    const enabledDebt: DebtAssumptions = {
      ...DEFAULT_DEBT_ASSUMPTIONS,
      enabled: true,
      termLoanAmount: 5_000_000,
    };

    const { flow } = applyDebtLayer(baseResult.flow, baseResult.metrics, enabledDebt);

    expect(flow[0].outstandingDebt).toBeDefined();
    expect(flow[0].interestExpense).toBeDefined();
    expect(flow[0].leveredCashFlow).toBeDefined();
  });
});

// ─── applyReservesRisk ─────────────────────────────────────────────

describe('applyReservesRisk', () => {
  const baseMetrics = calculateEconomics(
    TEST_WELLS,
    DEFAULT_TYPE_CURVE,
    DEFAULT_CAPEX,
    DEFAULT_COMMODITY_PRICING,
    DEFAULT_OPEX,
    DEFAULT_OWNERSHIP,
  ).metrics;

  it('PDP factor=1.0 leaves EUR unchanged', () => {
    const risked = applyReservesRisk(baseMetrics, 'PDP');

    expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur, 2);
    expect(risked.riskedNpv10).toBeCloseTo(baseMetrics.npv10, 2);
  });

  it('PROBABLE reduces by 50%', () => {
    const risked = applyReservesRisk(baseMetrics, 'PROBABLE');

    expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur * 0.5, 2);
    expect(risked.riskedNpv10).toBeCloseTo(baseMetrics.npv10 * 0.5, 2);
  });

  it('PUD reduces by 15%', () => {
    const risked = applyReservesRisk(baseMetrics, 'PUD');

    expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur * 0.85, 2);
    expect(risked.riskedNpv10).toBeCloseTo(baseMetrics.npv10 * 0.85, 2);
  });

  it('POSSIBLE reduces by 85%', () => {
    const risked = applyReservesRisk(baseMetrics, 'POSSIBLE');

    expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur * 0.15, 2);
    expect(risked.riskedNpv10).toBeCloseTo(baseMetrics.npv10 * 0.15, 2);
  });

  it('undefined category returns metrics unchanged', () => {
    const risked = applyReservesRisk(baseMetrics, undefined);

    expect(risked).toBe(baseMetrics);
  });
});

// ─── aggregateEconomics ────────────────────────────────────────────

describe('aggregateEconomics', () => {
  it('sums across groups correctly', () => {
    const result1 = calculateEconomics(
      [MOCK_WELLS[0]],
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    const result2 = calculateEconomics(
      [MOCK_WELLS[1]],
      DEFAULT_TYPE_CURVE,
      DEFAULT_CAPEX,
      DEFAULT_COMMODITY_PRICING,
      DEFAULT_OPEX,
      DEFAULT_OWNERSHIP,
    );

    const groups: WellGroup[] = [
      {
        id: 'g-1',
        name: 'Group 1',
        color: '#3b82f6',
        wellIds: new Set([MOCK_WELLS[0].id]),
        typeCurve: DEFAULT_TYPE_CURVE,
        capex: DEFAULT_CAPEX,
        opex: DEFAULT_OPEX,
        ownership: DEFAULT_OWNERSHIP,
        flow: result1.flow,
        metrics: result1.metrics,
      },
      {
        id: 'g-2',
        name: 'Group 2',
        color: '#10b981',
        wellIds: new Set([MOCK_WELLS[1].id]),
        typeCurve: DEFAULT_TYPE_CURVE,
        capex: DEFAULT_CAPEX,
        opex: DEFAULT_OPEX,
        ownership: DEFAULT_OWNERSHIP,
        flow: result2.flow,
        metrics: result2.metrics,
      },
    ];

    const { metrics } = aggregateEconomics(groups);

    expect(metrics.wellCount).toBe(2);
    expect(metrics.totalCapex).toBeCloseTo(
      result1.metrics.totalCapex + result2.metrics.totalCapex,
      2,
    );
    expect(metrics.eur).toBeCloseTo(result1.metrics.eur + result2.metrics.eur, 2);
    expect(metrics.npv10).toBeCloseTo(result1.metrics.npv10 + result2.metrics.npv10, 2);
  });

  it('returns 120 months of flow', () => {
    const { flow } = aggregateEconomics([]);
    expect(flow).toHaveLength(120);
  });

  it('empty groups produce zero metrics', () => {
    const { metrics } = aggregateEconomics([]);

    expect(metrics.totalCapex).toBe(0);
    expect(metrics.eur).toBe(0);
    expect(metrics.npv10).toBe(0);
    expect(metrics.wellCount).toBe(0);
  });
});
