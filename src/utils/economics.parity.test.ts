import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyDebtLayer,
  applyReservesRisk,
  applyTaxLayer,
  calculateEconomics,
} from './economics';
import type { DealMetrics, EconomicsCalculationInput, MonthlyCashFlow } from '../types';

interface EconomicsParityFixture {
  input: EconomicsCalculationInput;
  expected: {
    metrics: DealMetrics;
    first12MonthlyFlow: Array<Partial<MonthlyCashFlow>>;
  };
}

const loadFixture = (): EconomicsParityFixture => {
  const raw = readFileSync(join(process.cwd(), 'fixtures/economics/dual-parity-rich.json'), 'utf8');
  return JSON.parse(raw) as EconomicsParityFixture;
};

const expectClose = (actual: number | undefined, expected: number | undefined, digits = 5) => {
  expect(actual).toBeTypeOf('number');
  expect(expected).toBeTypeOf('number');
  expect(actual as number).toBeCloseTo(expected as number, digits);
};

describe('economics dual-parity fixture', () => {
  it('keeps the TypeScript engine aligned to the shared rich golden fixture', () => {
    const fixture = loadFixture();
    const input = fixture.input;
    const base = calculateEconomics(
      input.wells,
      input.typeCurve,
      input.capex,
      input.pricing,
      input.opex,
      input.ownership,
      input.scalars,
      input.scheduleOverride ?? undefined,
    );
    const taxed = applyTaxLayer(base.flow, base.metrics, input.taxAssumptions ?? undefined);
    const levered = applyDebtLayer(taxed.flow, taxed.metrics, input.debtAssumptions ?? undefined);
    const metrics = applyReservesRisk(levered.metrics, input.reserveCategory ?? undefined);

    const metricKeys: Array<keyof DealMetrics> = [
      'totalCapex',
      'eur',
      'npv10',
      'payoutMonths',
      'wellCount',
      'afterTaxNpv10',
      'afterTaxPayoutMonths',
      'leveredNpv10',
      'dscr',
      'riskedEur',
      'riskedNpv10',
    ];
    metricKeys.forEach((key) => expectClose(metrics[key] as number | undefined, fixture.expected.metrics[key] as number | undefined, 4));

    fixture.expected.first12MonthlyFlow.forEach((expectedRow, index) => {
      const actualRow = levered.flow[index];
      expect(actualRow.month).toBe(expectedRow.month);
      expectClose(actualRow.oilProduction, expectedRow.oilProduction, 4);
      expectClose(actualRow.gasProduction, expectedRow.gasProduction, 4);
      expectClose(actualRow.revenue, expectedRow.revenue, 4);
      expectClose(actualRow.capex, expectedRow.capex, 4);
      expectClose(actualRow.opex, expectedRow.opex, 4);
      expectClose(actualRow.netCashFlow, expectedRow.netCashFlow, 4);
      expectClose(actualRow.afterTaxCashFlow, expectedRow.afterTaxCashFlow, 4);
      expectClose(actualRow.leveredCashFlow, expectedRow.leveredCashFlow, 4);
      expectClose(actualRow.outstandingDebt, expectedRow.outstandingDebt, 4);
    });
  });
});
