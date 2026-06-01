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

interface PythonGolden {
  generatedBy: string;
  sourceFixture: string;
  metrics: DealMetrics;
  first12MonthlyFlow: Array<Partial<MonthlyCashFlow>>;
}

const loadFixture = (): EconomicsParityFixture => {
  const raw = readFileSync(join(process.cwd(), 'fixtures/economics/dual-parity-rich.json'), 'utf8');
  return JSON.parse(raw) as EconomicsParityFixture;
};

const loadPythonGolden = (): PythonGolden => {
  const raw = readFileSync(join(process.cwd(), 'fixtures/economics/dual-parity-golden.json'), 'utf8');
  return JSON.parse(raw) as PythonGolden;
};

const expectClose = (actual: number | undefined, expected: number | undefined, digits = 5) => {
  expect(actual).toBeTypeOf('number');
  expect(expected).toBeTypeOf('number');
  expect(actual as number).toBeCloseTo(expected as number, digits);
};

// Tolerance for TS↔Python cross-engine assertions: relative error < 1e-4 (4 significant digits).
// Both engines produce numerically identical results for this fixture (max observed relative
// error = 0.0), so digits=4 is conservative and gives a meaningful drift backstop.
const CROSS_ENGINE_DIGITS = 4;

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
    const taxed = applyTaxLayer(base.flow, base.metrics, input.taxAssumptions!);
    const levered = applyDebtLayer(taxed.flow, taxed.metrics, input.debtAssumptions!);
    const metrics = applyReservesRisk(levered.metrics, input.reserveCategory ?? undefined);

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

  it('TypeScript engine matches Python-derived golden within tolerance (drift backstop)', () => {
    const fixture = loadFixture();
    const golden = loadPythonGolden();
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
    const taxed = applyTaxLayer(base.flow, base.metrics, input.taxAssumptions!);
    const levered = applyDebtLayer(taxed.flow, taxed.metrics, input.debtAssumptions!);
    const metrics = applyReservesRisk(levered.metrics, input.reserveCategory ?? undefined);

    // Assert TS output matches Python golden for every tracked metric.
    metricKeys.forEach((key) =>
      expectClose(
        metrics[key] as number | undefined,
        golden.metrics[key] as number | undefined,
        CROSS_ENGINE_DIGITS,
      ),
    );

    // Assert TS matches Python golden for the first 12 monthly flow rows.
    golden.first12MonthlyFlow.forEach((pyRow, index) => {
      const tsRow = levered.flow[index];
      expect(tsRow.month).toBe(pyRow.month);
      expectClose(tsRow.oilProduction, pyRow.oilProduction, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.gasProduction, pyRow.gasProduction, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.revenue, pyRow.revenue, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.capex, pyRow.capex, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.opex, pyRow.opex, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.netCashFlow, pyRow.netCashFlow, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.afterTaxCashFlow, pyRow.afterTaxCashFlow, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.leveredCashFlow, pyRow.leveredCashFlow, CROSS_ENGINE_DIGITS);
      expectClose(tsRow.outstandingDebt, pyRow.outstandingDebt, CROSS_ENGINE_DIGITS);
    });
  });
});
