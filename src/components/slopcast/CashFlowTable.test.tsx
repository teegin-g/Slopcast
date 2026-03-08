import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CashFlowTable from './CashFlowTable';
import { clearFilterStore } from './hooks/useTableFilters';
import type { MonthlyCashFlow, CommodityPricingAssumptions } from '../../types';

const pricing: CommodityPricingAssumptions = {
  oilPrice: 75,
  gasPrice: 3.25,
  oilDifferential: 0,
  gasDifferential: 0,
};

/** 18 months spanning 2024 (12 months) and 2025 (6 months) */
function makeMockFlow(): MonthlyCashFlow[] {
  const rows: MonthlyCashFlow[] = [];
  for (let i = 0; i < 18; i++) {
    const year = i < 12 ? 2024 : 2025;
    const monthInYear = i < 12 ? i + 1 : i - 11;
    const dateStr = `${year}-${String(monthInYear).padStart(2, '0')}-01`;
    rows.push({
      month: i + 1,
      date: dateStr,
      oilProduction: 1000,
      gasProduction: 5000,
      revenue: 80000,
      capex: i === 0 ? 500000 : 0,
      opex: 8500,
      netCashFlow: i === 0 ? -428500 : 71500,
      cumulativeCashFlow: -428500 + i * 71500,
      severanceTax: 3000,
      adValoremTax: 1200,
    });
  }
  return rows;
}

beforeEach(() => {
  clearFilterStore();
});

describe('CashFlowTable', () => {
  it('renders annual rows with correct year labels', () => {
    render(<CashFlowTable flow={makeMockFlow()} pricing={pricing} />);
    // Year labels appear in both the table rows and filter dropdown
    expect(screen.getAllByText('2024').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2025').length).toBeGreaterThanOrEqual(1);
  });

  it('expanding an annual row shows monthly rows', () => {
    render(<CashFlowTable flow={makeMockFlow()} pricing={pricing} />);

    // Before expanding, monthly rows (like "Jan") should not be visible
    expect(screen.queryByText('Jan')).toBeNull();

    // Click the 2024 row expand button
    const expandBtn = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(expandBtn);

    // After expanding, monthly names should appear
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
  });

  it('negative values display with parentheses formatting', () => {
    render(<CashFlowTable flow={makeMockFlow()} pricing={pricing} />);

    // Expand the first annual row to see monthly detail
    const expandBtn = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(expandBtn);

    // First month has net CF of -$428,500 which should render as ($428,500)
    const negCells = screen.getAllByText('($428,500)');
    expect(negCells.length).toBeGreaterThanOrEqual(1);
  });

  it('all expected columns are rendered in header', () => {
    render(<CashFlowTable flow={makeMockFlow()} pricing={pricing} />);

    // Check header row specifically via thead
    const thead = document.querySelector('thead')!;
    const headerTexts = Array.from(thead.querySelectorAll('th')).map(th => th.textContent?.trim());

    const expectedHeaders = [
      'Period',
      'Oil (bbl)',
      'Gas (mcf)',
      'Oil Rev',
      'Gas Rev',
      'LOE',
      'CAPEX',
      'Taxes',
      'Net CF',
      'Cumulative',
    ];

    for (const header of expectedHeaders) {
      expect(headerTexts).toContain(header);
    }
  });

  it('renders empty state when no flow data', () => {
    render(<CashFlowTable flow={[]} pricing={pricing} />);
    expect(screen.getByText(/no cash flow/i)).toBeTruthy();
  });
});
