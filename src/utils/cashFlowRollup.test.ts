import { describe, it, expect } from 'vitest';
import { buildAnnualRollups, formatAccounting, type AnnualCashFlowRow } from './cashFlowRollup';
import type { MonthlyCashFlow } from '../types';

/** Generate N months of mock cash flow data starting from a given year-month */
function makeMockFlow(months: number, startYear = 2024, startMonth = 1): MonthlyCashFlow[] {
  const rows: MonthlyCashFlow[] = [];
  for (let i = 0; i < months; i++) {
    const m = startMonth + i;
    const year = startYear + Math.floor((m - 1) / 12);
    const monthInYear = ((m - 1) % 12) + 1;
    const dateStr = `${year}-${String(monthInYear).padStart(2, '0')}-01`;
    rows.push({
      month: i + 1,
      date: dateStr,
      oilProduction: 1000 + i * 10,
      gasProduction: 5000 + i * 50,
      revenue: 80000 + i * 100,
      capex: i === 0 ? 500000 : 0,
      opex: 8500,
      netCashFlow: (i === 0 ? -428500 : 71500) + i * 100,
      cumulativeCashFlow: -428500 + i * 71600 + i * 100,
      severanceTax: 3000,
      adValoremTax: 1200,
    });
  }
  return rows;
}

const pricing = { oilPrice: 75, gasPrice: 3.25 };

describe('buildAnnualRollups', () => {
  it('groups 24 months into 2 annual rows', () => {
    const flow = makeMockFlow(24);
    const annuals = buildAnnualRollups(flow, pricing);
    expect(annuals).toHaveLength(2);
    expect(annuals[0].year).toBe(2024);
    expect(annuals[1].year).toBe(2025);
  });

  it('annual row sums match sum of monthly values for production and financial fields', () => {
    const flow = makeMockFlow(24);
    const annuals = buildAnnualRollups(flow, pricing);

    // Year 1 is months 0..11 (first 12 months)
    const year1Monthly = flow.slice(0, 12);
    const annual1 = annuals[0];

    expect(annual1.oilProduction).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.oilProduction, 0)
    );
    expect(annual1.gasProduction).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.gasProduction, 0)
    );
    expect(annual1.revenue).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.revenue, 0)
    );
    expect(annual1.capex).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.capex, 0)
    );
    expect(annual1.opex).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.opex, 0)
    );
    expect(annual1.netCashFlow).toBeCloseTo(
      year1Monthly.reduce((s, m) => s + m.netCashFlow, 0)
    );
  });

  it('annual cumulative equals last month cumulative in that year', () => {
    const flow = makeMockFlow(24);
    const annuals = buildAnnualRollups(flow, pricing);

    // Year 1 last month is index 11
    expect(annuals[0].cumulativeCashFlow).toBe(flow[11].cumulativeCashFlow);
    // Year 2 last month is index 23
    expect(annuals[1].cumulativeCashFlow).toBe(flow[23].cumulativeCashFlow);
  });

  it('subRows contain the original monthly rows', () => {
    const flow = makeMockFlow(24);
    const annuals = buildAnnualRollups(flow, pricing);

    expect(annuals[0].subRows).toHaveLength(12);
    expect(annuals[1].subRows).toHaveLength(12);
    // First sub-row of year 1 should be the first flow item
    expect(annuals[0].subRows[0]).toBe(flow[0]);
  });

  it('derives oil and gas revenue from production * pricing', () => {
    const flow = makeMockFlow(12);
    const annuals = buildAnnualRollups(flow, pricing);

    const expectedOilRev = flow.reduce((s, m) => s + m.oilProduction * pricing.oilPrice, 0);
    const expectedGasRev = flow.reduce((s, m) => s + m.gasProduction * pricing.gasPrice, 0);

    expect(annuals[0].oilRevenue).toBeCloseTo(expectedOilRev);
    expect(annuals[0].gasRevenue).toBeCloseTo(expectedGasRev);
  });

  it('sums taxes from severanceTax + adValoremTax', () => {
    const flow = makeMockFlow(12);
    const annuals = buildAnnualRollups(flow, pricing);

    const expectedTaxes = flow.reduce(
      (s, m) => s + (m.severanceTax ?? 0) + (m.adValoremTax ?? 0),
      0
    );
    expect(annuals[0].taxes).toBeCloseTo(expectedTaxes);
  });

  it('returns empty array for empty input', () => {
    const annuals = buildAnnualRollups([], pricing);
    expect(annuals).toEqual([]);
  });
});

describe('formatAccounting', () => {
  it('formats positive value', () => {
    const result = formatAccounting(1234);
    expect(result.text).toBe('$1,234');
    expect(result.negative).toBe(false);
  });

  it('formats negative value with parentheses', () => {
    const result = formatAccounting(-1234);
    expect(result.text).toBe('($1,234)');
    expect(result.negative).toBe(true);
  });

  it('formats zero', () => {
    const result = formatAccounting(0);
    expect(result.text).toBe('$0');
    expect(result.negative).toBe(false);
  });

  it('formats large numbers with commas', () => {
    const result = formatAccounting(1234567);
    expect(result.text).toBe('$1,234,567');
    expect(result.negative).toBe(false);
  });

  it('formats large negative with parentheses and commas', () => {
    const result = formatAccounting(-9876543);
    expect(result.text).toBe('($9,876,543)');
    expect(result.negative).toBe(true);
  });
});
