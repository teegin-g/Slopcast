import type { MonthlyCashFlow } from '../types';

export interface AnnualCashFlowRow {
  year: number;
  oilProduction: number;
  gasProduction: number;
  oilRevenue: number;
  gasRevenue: number;
  revenue: number;
  capex: number;
  opex: number;
  taxes: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  subRows: MonthlyCashFlow[];
}

/**
 * Group monthly cash flow data into annual rollup rows.
 * Each annual row contains subRows with the original monthly data
 * for TanStack Table expanding.
 */
export function buildAnnualRollups(
  flow: MonthlyCashFlow[],
  pricing: { oilPrice: number; gasPrice: number },
): AnnualCashFlowRow[] {
  if (flow.length === 0) return [];

  // Group by year extracted from the date string
  const byYear = new Map<number, MonthlyCashFlow[]>();
  for (const row of flow) {
    const year = parseInt(row.date.slice(0, 4), 10);
    let bucket = byYear.get(year);
    if (!bucket) {
      bucket = [];
      byYear.set(year, bucket);
    }
    bucket.push(row);
  }

  // Build annual rows sorted by year
  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  return years.map((year) => {
    const months = byYear.get(year)!;

    let oilProduction = 0;
    let gasProduction = 0;
    let oilRevenue = 0;
    let gasRevenue = 0;
    let revenue = 0;
    let capex = 0;
    let opex = 0;
    let taxes = 0;
    let netCashFlow = 0;

    for (const m of months) {
      oilProduction += m.oilProduction;
      gasProduction += m.gasProduction;
      oilRevenue += m.oilProduction * pricing.oilPrice;
      gasRevenue += m.gasProduction * pricing.gasPrice;
      revenue += m.revenue;
      capex += m.capex;
      opex += m.opex;
      taxes += (m.severanceTax ?? 0) + (m.adValoremTax ?? 0);
      netCashFlow += m.netCashFlow;
    }

    // Cumulative is the last month's cumulative value in that year
    const cumulativeCashFlow = months[months.length - 1].cumulativeCashFlow;

    return {
      year,
      oilProduction,
      gasProduction,
      oilRevenue,
      gasRevenue,
      revenue,
      capex,
      opex,
      taxes,
      netCashFlow,
      cumulativeCashFlow,
      subRows: months,
    };
  });
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number in accounting style:
 * - Positive: $1,234
 * - Negative: ($1,234) with negative flag
 * - Zero: $0
 */
export function formatAccounting(value: number): { text: string; negative: boolean } {
  if (value === 0) {
    return { text: '$0', negative: false };
  }

  const negative = value < 0;
  const absFormatted = usdFormatter.format(Math.abs(value));

  if (negative) {
    return { text: `(${absFormatted})`, negative: true };
  }

  return { text: absFormatted, negative: false };
}
