import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WellsTable from './WellsTable';
import { clearFilterStore } from './hooks/useTableFilters';
import type { Well } from '../../types';

const mockWells: Well[] = [
  { id: 'w1', name: 'Alpha Well', lat: 31.9, lng: -102.1, lateralLength: 10500, status: 'PRODUCING', operator: 'Permian Co', formation: 'Wolfcamp' },
  { id: 'w2', name: 'Bravo Well', lat: 32.0, lng: -102.2, lateralLength: 8200, status: 'DUC', operator: 'Basin LLC', formation: 'Bone Spring' },
  { id: 'w3', name: 'Charlie Well', lat: 31.8, lng: -102.3, lateralLength: 12000, status: 'PERMIT', operator: 'Permian Co', formation: 'Wolfcamp' },
  { id: 'w4', name: 'Delta Well', lat: 31.7, lng: -102.4, lateralLength: 9500, status: 'PRODUCING', operator: 'Mesa Energy', formation: 'Delaware' },
];

function renderTable(props: Partial<React.ComponentProps<typeof WellsTable>> = {}) {
  const defaultProps = {
    wells: mockWells,
    selectedWellIds: new Set<string>(),
    onSelectWells: vi.fn(),
    onToggleWell: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <WellsTable {...defaultProps} {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  clearFilterStore();
});

afterEach(() => {
  cleanup();
});

describe('WellsTable', () => {
  it('renders all 5 column headers plus checkbox', () => {
    const { container } = renderTable();
    const table = container.querySelector('table')!;
    const headers = table.querySelectorAll('thead th');
    expect(headers.length).toBe(6); // checkbox + 5 data columns
    expect(screen.getByText('Well')).toBeDefined();
    expect(screen.getByText('Formation')).toBeDefined();
    expect(screen.getByText('Lateral')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Operator')).toBeDefined();
  });

  it('renders well rows with correct data', () => {
    const { container } = renderTable();
    const table = container.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
    expect(screen.getByText('Alpha Well')).toBeDefined();
    expect(screen.getByText('Bravo Well')).toBeDefined();
    expect(screen.getByText('Charlie Well')).toBeDefined();
    expect(screen.getByText('Delta Well')).toBeDefined();
    expect(screen.getByText('10,500 ft')).toBeDefined();
  });

  it('clicking column header triggers sort', () => {
    const { container } = renderTable();
    const wellHeader = screen.getByText('Well');
    fireEvent.click(wellHeader);
    // After sort asc, first row should be Alpha Well
    const table = container.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(4);
    const firstRowName = rows[0].querySelectorAll('td')[1]?.textContent;
    expect(firstRowName).toBe('Alpha Well');
  });

  it('global filter filters rows by text', () => {
    const { container } = renderTable();
    const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    const table = container.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Alpha Well');
  });

  it('checkbox select calls onSelectWells', () => {
    const onSelectWells = vi.fn();
    const { container } = renderTable({ onSelectWells });
    const table = container.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const firstRowCheckbox = rows[0].querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(firstRowCheckbox);
    expect(onSelectWells).toHaveBeenCalled();
  });

  it('selectedWellIds prop correctly marks rows as selected', () => {
    const { container } = renderTable({ selectedWellIds: new Set(['w1', 'w3']) });
    const table = container.querySelector('table')!;
    const rows = table.querySelectorAll('tbody tr');
    const checkboxes = Array.from(rows).map(
      row => row.querySelector('input[type="checkbox"]') as HTMLInputElement
    );
    // w1 (Alpha) = checked, w2 (Bravo) = unchecked, w3 (Charlie) = checked, w4 (Delta) = unchecked
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(true);
    expect(checkboxes[3].checked).toBe(false);
  });
});
